package com.example.micarrito

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.security.SecureRandom
import java.util.Base64

class BiometricHelper(
    private val activity: AppCompatActivity,
    private val webView: WebView
) {
    private val normalPrefsName = "micarrito_prefs"
    private val prefBioEnabled = "biometric_enabled"
    private val prefNickname = "bio_nickname"
    private val prefBioToken = "bio_token"

    private val prefs: SharedPreferences by lazy {
        activity.getSharedPreferences(normalPrefsName, Context.MODE_PRIVATE)
    }

    fun hasStoredCredentials(): Boolean {
        return prefs.getBoolean(prefBioEnabled, false)
    }

    fun getDiagnostic(): String {
        val prefSet = prefs.getBoolean(prefBioEnabled, false)
        val nickname = prefs.getString(prefNickname, null)
        val bioToken = prefs.getString(prefBioToken, null)
        return "api=${Build.VERSION.SDK_INT} prefBioEnabled=$prefSet nickname=$nickname hasToken=${bioToken != null}"
    }

    private fun generateBioToken(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun getPromptInfo(): BiometricPrompt.PromptInfo {
        val authenticators = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        }
        val builder = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Acceso biometrico")
            .setSubtitle("Confirma tu identidad para entrar")
            .setAllowedAuthenticators(authenticators)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            builder.setNegativeButtonText("Cancelar")
        }
        return builder.build()
    }

    private fun buildPrompt(
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ): BiometricPrompt {
        val executor = ContextCompat.getMainExecutor(activity)
        return BiometricPrompt(activity, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onError(errString.toString())
            }
        })
    }

    private fun showBiometricThen(onSuccess: () -> Unit, onError: (String) -> Unit) {
        buildPrompt(onSuccess, onError).authenticate(getPromptInfo())
    }

    fun enableBiometric(nickname: String) {
        if (prefs.getBoolean(prefBioEnabled, false)) {
            return
        }
        try {
            val bioToken = generateBioToken()
            prefs.edit()
                .putBoolean(prefBioEnabled, true)
                .putString(prefNickname, nickname)
                .putString(prefBioToken, bioToken)
                .apply()
            val js = "onBiometricEnabled(${JSONObject.quote(bioToken)})"
            webView.evaluateJavascript(js, null)
        } catch (e: Exception) {
            webView.evaluateJavascript("onBiometricError(${JSONObject.quote(e.message ?: "Error al guardar")})", null)
        }
    }

    fun authenticateAndLogin() {
        showBiometricThen(
            onSuccess = {
                try {
                    val nick = prefs.getString(prefNickname, null)
                    val token = prefs.getString(prefBioToken, null)
                    if (nick != null && token != null) {
                        val js = "onBiometricAuth(${JSONObject.quote(nick)}, ${JSONObject.quote(token)})"
                        webView.evaluateJavascript(js, null)
                    } else {
                        webView.evaluateJavascript(
                            "onBiometricError(${JSONObject.quote("No hay credenciales guardadas")})",
                            null
                        )
                    }
                } catch (ex: Exception) {
                    webView.evaluateJavascript(
                        "onBiometricError(${JSONObject.quote(ex.message ?: "Error al leer")})",
                        null
                    )
                }
            },
            onError = { msg ->
                webView.evaluateJavascript("onBiometricError(${JSONObject.quote(msg)})", null)
            }
        )
    }

    fun clearCredentials() {
        prefs.edit()
            .remove(prefBioEnabled)
            .remove(prefNickname)
            .remove(prefBioToken)
            .apply()
    }
}
