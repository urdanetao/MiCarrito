package com.example.micarrito

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.view.ActionMode
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Toast
import org.json.JSONObject
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splashLogo: ImageView
    private lateinit var errorLayout: LinearLayout
    private lateinit var btnRetry: Button
    private lateinit var biometricHelper: BiometricHelper
    
    private var hasError = false
    private var currentFcmToken: String? = null

    private val tokenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val token = intent?.getStringExtra("fcm_token") ?: return
            currentFcmToken = token
            if (webView.visibility == View.VISIBLE) {
                webView.evaluateJavascript(
                    "window.onFcmTokenReceived && window.onFcmTokenReceived(${JSONObject.quote(token)})",
                    null
                )
            }
        }
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onLost(network: Network) {
            runOnUiThread { showError() }
        }

        override fun onAvailable(network: Network) {
            runOnUiThread {
                if (hasError) retryLoading()
            }
        }
    }

    companion object {
        private const val TAG = "MainActivity"
        // const val BASE_URL = "http://192.168.1.20/micarrito"
        const val BASE_URL = "https://almacenadorasaiver.com/micarrito"
        const val SPLASH_TIME = 2000L
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private fun registerTokenReceiver() {
        val filter = IntentFilter("com.example.micarrito.FCM_TOKEN_RECEIVED")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(tokenReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(tokenReceiver, filter)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        // Iconos oscuros en la barra de estado para fondo claro
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        // Referencias a la UI
        webView = findViewById(R.id.webView)
        splashLogo = findViewById(R.id.splashLogo)
        errorLayout = findViewById(R.id.errorLayout)
        btnRetry = findViewById(R.id.btnRetry)

        // Configuración para Edge-to-Edge: respetar barra de estado
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { view, insets ->
            val statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top
            view.setPadding(0, statusBarHeight, 0, 0)
            insets
        }

        biometricHelper = BiometricHelper(this, webView)
        setupWebView()
        setupBackButton()
        registerTokenReceiver()

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "FCM token retrieval failed", task.exception)
                return@addOnCompleteListener
            }
            val token = task.result
            currentFcmToken = token
            Log.d(TAG, "FCM token: ${token?.take(20)}...")
        }

        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val networkRequest = NetworkRequest.Builder().build()
        connectivityManager.registerNetworkCallback(networkRequest, networkCallback)

        btnRetry.setOnClickListener {
            retryLoading()
        }

        // Timer para la Splash Screen inicial
        Handler(Looper.getMainLooper()).postDelayed({
            startApp()
        }, SPLASH_TIME)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.setBackgroundColor(0)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            setUseWideViewPort(true)
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.addJavascriptInterface(WebAppInterface(this, biometricHelper, webView) { currentFcmToken }, "Android")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                Log.d("WebView", "${msg?.message()} -- line ${msg?.lineNumber()} in ${msg?.sourceId()}")
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("WebView", "onPageFinished: $url")
                if (!hasError) {
                    showWebView()
                    currentFcmToken?.let { token ->
                        view?.evaluateJavascript(
                            "window.onFcmTokenReceived && window.onFcmTokenReceived(${JSONObject.quote(token)})",
                            null
                        )
                    }
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                Log.d("WebView", "onReceivedError: ${error?.errorCode} for ${request?.url}")
                if (request?.isForMainFrame == true) {
                    hasError = true
                    showError()
                }
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                Log.d("WebView", "onReceivedSslError: ${error?.url}")
                handler?.proceed()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }
    }

    private fun startApp() {
        hasError = false
        if (isNetworkAvailable()) {
            webView.loadUrl(BASE_URL)
        } else {
            showError()
        }
    }

    private fun retryLoading() {
        errorLayout.visibility = View.GONE
        hasError = false
        if (isNetworkAvailable()) {
            webView.loadUrl(BASE_URL)
        } else {
            showError()
        }
    }

    private fun showWebView() {
        splashLogo.visibility = View.GONE
        errorLayout.visibility = View.GONE
        webView.visibility = View.VISIBLE
    }

    private fun showError() {
        webView.visibility = View.GONE
        splashLogo.visibility = View.GONE
        errorLayout.visibility = View.VISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun setupBackButton() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.evaluateJavascript("javascript:onAndroidBack()", null)
                } else {
                    finish()
                }
            }
        })
    }

    /**
     * Interfaz para que la web se comunique con Android.
     */
    class WebAppInterface(
        private val activity: AppCompatActivity,
        private val biometricHelper: BiometricHelper,
        private val webView: WebView,
        private val tokenProvider: () -> String?
    ) {
        @JavascriptInterface
        fun onBackPressed() {
            // Método disponible para ser llamado desde JS: Android.onBackPressed()
        }

        @JavascriptInterface
        fun showToast(message: String, duration: Int) {
            activity.runOnUiThread {
                val toastDuration = if (duration > 3000) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
                Toast.makeText(activity, message, toastDuration).show()
            }
        }

        @JavascriptInterface
        fun isBiometricAvailable(): Boolean {
            return biometricHelper.hasStoredCredentials()
        }

        @JavascriptInterface
        fun hasBiometricHardware(): Boolean {
            return activity.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FINGERPRINT)
        }

        @JavascriptInterface
        fun getBiometricDiag(): String {
            return biometricHelper.getDiagnostic()
        }

        @JavascriptInterface
        fun enableBiometric(nickname: String) {
            activity.runOnUiThread {
                try {
                    biometricHelper.enableBiometric(nickname)
                } catch (e: Exception) {
                    Log.e("WebAppInterface", "enableBiometric error", e)
                    webView.evaluateJavascript(
                        "window.onBiometricError && window.onBiometricError(${JSONObject.quote(e.message ?: "Error desconocido")})",
                        null
                    )
                }
            }
        }

        @JavascriptInterface
        fun authenticateBiometric() {
            activity.runOnUiThread {
                try {
                    biometricHelper.authenticateAndLogin()
                } catch (e: Exception) {
                    Log.e("WebAppInterface", "authenticateBiometric error", e)
                    webView.evaluateJavascript(
                        "window.onBiometricError && window.onBiometricError(${JSONObject.quote(e.message ?: "Error desconocido")})",
                        null
                    )
                }
            }
        }

        @JavascriptInterface
        fun disableBiometric() {
            activity.runOnUiThread {
                try {
                    biometricHelper.clearCredentials()
                } catch (e: Exception) {
                    Log.e("WebAppInterface", "disableBiometric error", e)
                }
            }
        }

        @JavascriptInterface
        fun getFcmToken(): String {
            return tokenProvider() ?: ""
        }
    }

    override fun startActionMode(callback: ActionMode.Callback?): ActionMode? {
        // Desactiva el menú contextual de selección de texto (Copiar/Compartir/Seleccionar todo)
        return null
    }

    override fun startActionMode(callback: ActionMode.Callback?, type: Int): ActionMode? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(tokenReceiver)
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        connectivityManager.unregisterNetworkCallback(networkCallback)
    }
}