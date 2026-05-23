package com.chungsora.child

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** lock_time 정확 알람 — 앱이 종료돼도 17:00 잠금 트리거 (Phase 5) */
class LockAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        Log.i(TAG, "Lock alarm fired")
        LockHelper.nativeTick(context)
        LockHelper.scheduleNextAlarm(context)
    }

    companion object {
        private const val TAG = "ChungsoraAlarm"
    }
}
