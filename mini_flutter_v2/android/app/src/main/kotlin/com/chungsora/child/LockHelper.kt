package com.chungsora.child

import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray

object LockHelper {
    private const val TAG = "ChungsoraLockHelper"

    const val PREFS = BootReceiver.PREFS
    const val KEY_LOCKED = BootReceiver.KEY_LOCKED
    const val KEY_LOCK_TIME = "lock_time"
    const val KEY_LOCK_DAYS = "lock_days"
    const val KEY_ALLOWLIST = "allowlist_json"
    const val KEY_UNLOCKED_DATE = "unlocked_date"
    const val KEY_PAIRED = "paired"
    const val KEY_ALLOW_PHONE = "allow_phone"
    const val KEY_NEXT_ALARM_AT = "next_alarm_at"
    const val KEY_LAST_NATIVE_CHECK = "last_native_check"
    const val KEY_LAST_POLICY_SYNC = "last_policy_sync"
    const val KEY_PENDING_AUTO_LOCK = "pending_auto_lock"

    const val ACTION_AUTO_LOCK = "com.chungsora.child.ACTION_AUTO_LOCK"
    const val EXTRA_AUTO_LOCK = "auto_apply_lock"

    fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun syncPolicy(
        ctx: Context,
        lockTime: String,
        lockDays: String,
        allowlist: List<String>,
        allowPhone: Boolean,
        unlockedDate: String,
        paired: Boolean,
    ) {
        prefs(ctx).edit()
            .putString(KEY_LOCK_TIME, lockTime)
            .putString(KEY_LOCK_DAYS, lockDays)
            .putString(KEY_ALLOWLIST, JSONArray(allowlist).toString())
            .putBoolean(KEY_ALLOW_PHONE, allowPhone)
            .putString(KEY_UNLOCKED_DATE, unlockedDate)
            .putBoolean(KEY_PAIRED, paired)
            .putLong(KEY_LAST_POLICY_SYNC, System.currentTimeMillis())
            .apply()
        scheduleNextAlarm(ctx)
        Log.i(TAG, "Policy synced — $lockDays $lockTime paired=$paired")
    }

    fun readAllowlist(ctx: Context): List<String> {
        val raw = prefs(ctx).getString(KEY_ALLOWLIST, "[]") ?: "[]"
        val arr = JSONArray(raw)
        val out = mutableListOf<String>()
        for (i in 0 until arr.length()) out.add(arr.getString(i))
        if (allowPhone(ctx)) {
            if (!out.contains("dialer")) out.add("dialer")
            if (!out.contains("com.android.emergency")) out.add("com.android.emergency")
        }
        if (!out.contains(ctx.packageName)) out.add(ctx.packageName)
        return out
    }

    fun allowPhone(ctx: Context) = prefs(ctx).getBoolean(KEY_ALLOW_PHONE, true)

    fun shouldLockNow(ctx: Context): Boolean {
        val p = prefs(ctx)
        if (!p.getBoolean(KEY_PAIRED, false)) return false
        val lockTime = p.getString(KEY_LOCK_TIME, "17:00") ?: "17:00"
        val lockDays = p.getString(KEY_LOCK_DAYS, "월·수·금") ?: "월·수·금"
        val unlockedDate = p.getString(KEY_UNLOCKED_DATE, "") ?: ""
        val unlockedToday = unlockedDate == LockScheduleEvaluator.todayKey()
        return LockScheduleEvaluator.shouldLockNow(lockTime, lockDays, unlockedToday)
    }

    fun scheduleNextAlarm(ctx: Context) {
        val p = prefs(ctx)
        val lockTime = p.getString(KEY_LOCK_TIME, "17:00") ?: return
        val lockDays = p.getString(KEY_LOCK_DAYS, "월·수·금") ?: return
        val next = LockScheduleEvaluator.nextLockAtMillis(lockTime, lockDays) ?: return

        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(ctx, LockAlarmReceiver::class.java)
        val pi = PendingIntent.getBroadcast(
            ctx, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi)
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, next, pi)
            }
            p.edit().putLong(KEY_NEXT_ALARM_AT, next).apply()
            Log.i(TAG, "Alarm scheduled at $next")
        } catch (e: SecurityException) {
            Log.w(TAG, "Exact alarm permission missing", e)
        }
    }

    fun launchForAutoLock(ctx: Context) {
        LockHelper.prefs(ctx).edit().putBoolean(LockHelper.KEY_PENDING_AUTO_LOCK, true).apply()
        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        launch.putExtra(EXTRA_AUTO_LOCK, true)
        ctx.startActivity(launch)
    }

    fun nativeTick(ctx: Context) {
        prefs(ctx).edit().putLong(KEY_LAST_NATIVE_CHECK, System.currentTimeMillis()).apply()
        if (shouldLockNow(ctx) && !prefs(ctx).getBoolean(KEY_LOCKED, false)) {
            launchForAutoLock(ctx)
        }
    }
}
