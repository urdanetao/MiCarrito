package com.example.micarrito

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MiCarritoFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        private const val CHANNEL_ID = "micarrito_notifications"
        private const val CHANNEL_NAME = "MiCarrito"
        private const val PREFS_NAME = "micarrito_prefs"
        private const val PREF_FCM_TOKEN = "fcm_token"
    }

    private val prefs: SharedPreferences by lazy {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM token renovado: ${token.take(20)}...")

        prefs.edit().putString(PREF_FCM_TOKEN, token).apply()

        notifyWebViewTokenReceived(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "Mensaje recibido: ${message.notification?.title}")

        createNotificationChannel()

        val title = message.notification?.title ?: "MiCarrito"
        val body = message.notification?.body ?: ""

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = BitmapFactory.decodeResource(resources, R.drawable.micarrito_icon)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(largeIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(System.currentTimeMillis().toInt(), notification)

        if (message.data.isNotEmpty()) {
            val dataIntent = Intent("com.example.micarrito.FCM_DATA_RECEIVED").apply {
                putExtra("type", message.data["type"] ?: "")
                putExtra("compraId", message.data["compraId"] ?: "")
                setPackage(packageName)
            }
            sendBroadcast(dataIntent)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones de MiCarrito"
                enableVibration(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun notifyWebViewTokenReceived(token: String) {
        val intent = Intent("com.example.micarrito.FCM_TOKEN_RECEIVED").apply {
            putExtra("fcm_token", token)
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }
}
