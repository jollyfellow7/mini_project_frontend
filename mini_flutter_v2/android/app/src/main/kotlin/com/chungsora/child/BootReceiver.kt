package com.chungsora.child

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val prefs = LockHelper.prefs(context)
        val paired = prefs.getBoolean(LockHelper.KEY_PAIRED, false)
        val locked = prefs.getBoolean(LockHelper.KEY_LOCKED, false)

        Log.i(TAG, "Boot — paired=$paired locked=$locked")

        if (paired) {
            LockHelper.scheduleNextAlarm(context)
            LockMonitorService.start(context)
        }

        if (locked || LockHelper.shouldLockNow(context)) {
            prefs.edit().putBoolean(LockHelper.KEY_PENDING_AUTO_LOCK, true).apply()
            LockHelper.launchForAutoLock(context)
        }
    }

    companion object {
        private const val TAG = "ChungsoraBoot"
        const val PREFS = "chungsora_lock"
        const val KEY_LOCKED = "locked"
    }
}
