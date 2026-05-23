package com.chungsora.child

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(LockPlugin())
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        markPendingAutoLock(intent)
    }

    override fun onResume() {
        super.onResume()
        markPendingAutoLock(intent)
    }

    private fun markPendingAutoLock(intent: Intent?) {
        if (intent?.getBooleanExtra(LockHelper.EXTRA_AUTO_LOCK, false) == true) {
            LockHelper.prefs(this).edit()
                .putBoolean(LockHelper.KEY_PENDING_AUTO_LOCK, true)
                .apply()
        }
    }
}
