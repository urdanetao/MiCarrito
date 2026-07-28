package com.example.micarrito

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

class QrScannerHelper(
    private val activity: Activity,
    private val onResult: (String) -> Unit
) {
    private val executor = Executors.newSingleThreadExecutor()
    private var previewView: PreviewView? = null
    private var containerRef: ViewGroup? = null
    private var isScanning = false

    fun setContainer(container: ViewGroup) {
        containerRef = container
    }

    fun removePreviewView() {
        stopScanning()
        previewView?.let {
            (it.parent as? ViewGroup)?.removeView(it)
        }
        previewView = null
    }

    fun startScanning() {
        if (isScanning) return
        val container = containerRef ?: return
        previewView = PreviewView(activity).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            container.addView(this)
        }
        val perm = ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
        if (perm == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            activity.requestPermissions(
                arrayOf(Manifest.permission.CAMERA),
                REQUEST_CAMERA_PERMISSION
            )
        }
    }

    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera()
            } else {
                showPermissionDeniedDialog()
            }
        }
    }

    private fun startCamera() {
        isScanning = true
        val cameraProviderFuture = ProcessCameraProvider.getInstance(activity)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView?.surfaceProvider)
            }
            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(executor, QrAnalyzer { barcodeValue ->
                        onResult(barcodeValue)
                        stopScanning()
                    })
                }
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    activity as androidx.lifecycle.LifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (e: Exception) {
                Log.e("QrScanner", "Camera binding failed", e)
                isScanning = false
            }
        }, ContextCompat.getMainExecutor(activity))
    }

    private fun stopScanning() {
        isScanning = false
        try {
            val cameraProviderFuture = ProcessCameraProvider.getInstance(activity)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                cameraProvider.unbindAll()
            }, ContextCompat.getMainExecutor(activity))
        } catch (_: Exception) {
        }
        executor.shutdown()
    }

    private fun showPermissionDeniedDialog() {
        android.app.AlertDialog.Builder(activity)
            .setTitle("Permiso de cámara necesario")
            .setMessage("Para escanear códigos QR se necesita acceso a la cámara. Habilite el permiso en Configuración de la app.")
            .setPositiveButton("Configuración") { _, _ ->
                val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = android.net.Uri.fromParts("package", activity.packageName, null)
                }
                activity.startActivity(intent)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    inner class QrAnalyzer(private val onQrDetected: (String) -> Unit) : ImageAnalysis.Analyzer {
        override fun analyze(imageProxy: ImageProxy) {
            val mediaImage = imageProxy.image
            if (mediaImage != null) {
                val rotation = imageProxy.imageInfo.rotationDegrees
                val inputImage = InputImage.fromMediaImage(mediaImage, rotation)
                val scanner = BarcodeScanning.getClient(
                    BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                        .build()
                )
                scanner.process(inputImage)
                    .addOnSuccessListener { barcodes ->
                        val code = barcodes.firstOrNull()?.rawValue
                        if (!code.isNullOrBlank()) {
                            onQrDetected(code)
                        }
                        imageProxy.close()
                    }
                    .addOnFailureListener {
                        imageProxy.close()
                    }
            } else {
                imageProxy.close()
            }
        }
    }

    companion object {
        const val REQUEST_CAMERA_PERMISSION = 1001
    }
}