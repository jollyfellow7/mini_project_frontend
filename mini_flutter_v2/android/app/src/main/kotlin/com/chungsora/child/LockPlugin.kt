package com.chungsora.child

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telecom.TelecomManager
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler

class LockPlugin : FlutterPlugin, MethodCallHandler, ActivityAware {
    private lateinit var channel: MethodChannel
    private lateinit var appContext: Context
    private var activity: Activity? = null

    private val adminComponent: ComponentName
        get() = ComponentName(appContext, ChungsoraDeviceAdminReceiver::class.java)

    private fun dpm(): DevicePolicyManager =
        appContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        appContext = binding.applicationContext
        channel = MethodChannel(binding.binaryMessenger, CHANNEL)
        channel.setMethodCallHandler(this)
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
    }

    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        activity = binding.activity
    }

    override fun onDetachedFromActivityForConfigChanges() {
        activity = null
    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
        activity = binding.activity
    }

    override fun onDetachedFromActivity() {
        activity = null
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        try {
            when (call.method) {
                "isDeviceOwner" -> result.success(dpm().isDeviceOwnerApp(appContext.packageName))
                "isAdminActive" -> result.success(dpm().isAdminActive(adminComponent))
                "isLockTaskActive" -> result.success(isLockTaskActive(activity))
                "getStatus" -> result.success(buildStatusMap())
                "requestAdmin" -> {
                    val act = activity
                    if (act == null) {
                        result.error("NO_ACTIVITY", "Activity not available", null)
                        return
                    }
                    val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                        putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                        putExtra(
                            DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                            "청소해라가 기기 잠금을 위해 기기 관리자 권한이 필요합니다.",
                        )
                    }
                    act.startActivity(intent)
                    result.success(true)
                }
                "startLock" -> {
                    @Suppress("UNCHECKED_CAST")
                    val allowlist = call.argument<List<String>>("allowlist") ?: emptyList()
                    startLock(allowlist, result)
                }
                "stopLock" -> stopLock(result)
                "syncPolicy" -> {
                    val lockTime = call.argument<String>("lockTime") ?: "17:00"
                    val lockDays = call.argument<String>("lockDays") ?: "월·수·금"
                    val lockDates = call.argument<String>("lockDates") ?: ""
                    @Suppress("UNCHECKED_CAST")
                    val allowlist = call.argument<List<String>>("allowlist") ?: emptyList()
                    val allowPhone = call.argument<Boolean>("allowPhone") ?: true
                    val unlockedDate = call.argument<String>("unlockedDate") ?: ""
                    val paired = call.argument<Boolean>("paired") ?: false
                    LockHelper.syncPolicy(
                        appContext, lockTime, lockDays, lockDates, allowlist, allowPhone, unlockedDate, paired,
                    )
                    result.success(true)
                }
                "startMonitor" -> {
                    LockMonitorService.start(appContext)
                    LockHelper.scheduleNextAlarm(appContext)
                    result.success(true)
                }
                "stopMonitor" -> {
                    LockMonitorService.stop(appContext)
                    result.success(true)
                }
                "consumePendingAutoLock" -> {
                    val p = LockHelper.prefs(appContext)
                    val pending = p.getBoolean(LockHelper.KEY_PENDING_AUTO_LOCK, false)
                    if (pending) p.edit().remove(LockHelper.KEY_PENDING_AUTO_LOCK).apply()
                    result.success(pending)
                }
                "getDiagnostics" -> result.success(buildDiagnosticsMap())
                "requestBatteryExemption" -> requestBatteryExemption(result)
                "isIgnoringBatteryOptimizations" -> result.success(isIgnoringBatteryOptimizations())
                else -> result.notImplemented()
            }
        } catch (e: Exception) {
            Log.e(TAG, "onMethodCall ${call.method}", e)
            result.error("LOCK_ERROR", e.message, null)
        }
    }

    private fun isLockTaskActive(activity: Activity?): Boolean {
        val act = activity ?: return false
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false
        val am = act.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    private fun buildDiagnosticsMap(): Map<String, Any?> {
        val p = LockHelper.prefs(appContext)
        val packages = resolveAllowlistPackages(LockHelper.readAllowlist(appContext))
        return mapOf(
            "deviceOwner" to dpm().isDeviceOwnerApp(appContext.packageName),
            "adminActive" to dpm().isAdminActive(adminComponent),
            "lockTaskActive" to isLockTaskActive(activity),
            "locked" to p.getBoolean(LockHelper.KEY_LOCKED, false),
            "monitorRunning" to LockMonitorService.running,
            "batteryOptimized" to isIgnoringBatteryOptimizations(),
            "nextAlarmAt" to p.getLong(LockHelper.KEY_NEXT_ALARM_AT, 0L),
            "lastNativeCheck" to p.getLong(LockHelper.KEY_LAST_NATIVE_CHECK, 0L),
            "lastPolicySync" to p.getLong(LockHelper.KEY_LAST_POLICY_SYNC, 0L),
            "cachedLockTime" to p.getString(LockHelper.KEY_LOCK_TIME, null),
            "cachedLockDays" to p.getString(LockHelper.KEY_LOCK_DAYS, null),
            "nativeShouldLock" to LockHelper.shouldLockNow(appContext),
            "resolvedPackages" to packages,
            "paired" to p.getBoolean(LockHelper.KEY_PAIRED, false),
        )
    }

    private fun isIgnoringBatteryOptimizations(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true
        val pm = appContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        return pm.isIgnoringBatteryOptimizations(appContext.packageName)
    }

    private fun requestBatteryExemption(result: MethodChannel.Result) {
        val act = activity
        if (act == null) {
            result.error("NO_ACTIVITY", "Activity not available", null)
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${appContext.packageName}")
            }
            act.startActivity(intent)
        }
        result.success(true)
    }

    private fun buildStatusMap(): Map<String, Any?> {
        val p = LockHelper.prefs(appContext)
        return mapOf(
            "deviceOwner" to dpm().isDeviceOwnerApp(appContext.packageName),
            "adminActive" to dpm().isAdminActive(adminComponent),
            "lockTaskActive" to isLockTaskActive(activity),
            "locked" to p.getBoolean(LockHelper.KEY_LOCKED, false),
        )
    }

    private fun startLock(allowlist: List<String>, result: MethodChannel.Result) {
        if (!dpm().isDeviceOwnerApp(appContext.packageName)) {
            result.error(
                "NOT_DEVICE_OWNER",
                "Device Owner가 아닙니다. docs/DEVICE_OWNER_SETUP.md 참고",
                null,
            )
            return
        }
        val act = activity
        if (act == null) {
            result.error("NO_ACTIVITY", "Activity not available", null)
            return
        }

        val packages = resolveAllowlistPackages(allowlist)
        dpm().setLockTaskPackages(adminComponent, packages.toTypedArray())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            dpm().setLockTaskFeatures(
                adminComponent,
                DevicePolicyManager.LOCK_TASK_FEATURE_NONE,
            )
        }

        if (!isLockTaskActive(act)) {
            act.startLockTask()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            dpm().setStatusBarDisabled(adminComponent, true)
        }

        LockHelper.prefs(appContext).edit()
            .putBoolean(LockHelper.KEY_LOCKED, true)
            .apply()

        Log.i(TAG, "Lock started — packages: $packages")
        result.success(true)
    }

    private fun stopLock(result: MethodChannel.Result) {
        val act = activity
        if (act != null && isLockTaskActive(act)) {
            act.stopLockTask()
        }

        if (dpm().isDeviceOwnerApp(appContext.packageName) &&
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
        ) {
            dpm().setStatusBarDisabled(adminComponent, false)
        }

        LockHelper.prefs(appContext).edit()
            .putBoolean(LockHelper.KEY_LOCKED, false)
            .apply()

        Log.i(TAG, "Lock stopped")
        result.success(true)
    }

    private fun resolveAllowlistPackages(allowlist: List<String>): List<String> {
        val out = linkedSetOf(appContext.packageName)

        for (raw in allowlist) {
            when (raw) {
                "dialer" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val tm = appContext.getSystemService(TelecomManager::class.java)
                        tm?.defaultDialerPackage?.let { out.add(it) }
                    }
                    DIALER_FALLBACKS.forEach { out.add(it) }
                }
                "com.android.emergency", "emergency" -> {
                    EMERGENCY_FALLBACKS.forEach { out.add(it) }
                }
                else -> out.add(raw)
            }
        }

        return out.filter { pkg ->
            try {
                appContext.packageManager.getApplicationInfo(pkg, 0)
                true
            } catch (_: Exception) {
                false
            }
        }.toList()
    }

    companion object {
        const val CHANNEL = "com.chungsora.child/lock"

        private const val TAG = "ChungsoraLock"

        private val DIALER_FALLBACKS = listOf(
            "com.google.android.dialer",
            "com.samsung.android.dialer",
            "com.android.dialer",
        )

        private val EMERGENCY_FALLBACKS = listOf(
            "com.android.emergency",
            "com.google.android.apps.emergencyassist",
            "com.google.android.apps.emergencyassistant",
        )
    }
}
