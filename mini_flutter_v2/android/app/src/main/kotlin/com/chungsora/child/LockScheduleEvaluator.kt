package com.chungsora.child

import java.util.Calendar
import java.util.Locale

/** Dart LockScheduler와 동일 — 네이티브 백그라운드 감시용 */
object LockScheduleEvaluator {
    private val dayMap = mapOf(
        "월" to Calendar.MONDAY,
        "화" to Calendar.TUESDAY,
        "수" to Calendar.WEDNESDAY,
        "목" to Calendar.THURSDAY,
        "금" to Calendar.FRIDAY,
        "토" to Calendar.SATURDAY,
        "일" to Calendar.SUNDAY,
    )

    fun todayKey(): String {
        val c = Calendar.getInstance()
        return String.format(
            Locale.US,
            "%04d-%02d-%02d",
            c.get(Calendar.YEAR),
            c.get(Calendar.MONTH) + 1,
            c.get(Calendar.DAY_OF_MONTH),
        )
    }

    fun shouldLockNow(lockTime: String, lockDays: String, unlockedToday: Boolean): Boolean {
        if (unlockedToday) return false
        if (!isLockDay(lockDays)) return false
        return isPastLockTime(lockTime)
    }

    fun isLockDay(lockDays: String): Boolean {
        val today = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
        return lockDays.split("·", ",", " ")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .any { dayMap[it] == today }
    }

    fun isPastLockTime(lockTime: String): Boolean {
        val parts = lockTime.trim().split(":")
        if (parts.size != 2) return false
        val hour = parts[0].toIntOrNull() ?: return false
        val minute = parts[1].toIntOrNull() ?: return false
        val now = Calendar.getInstance()
        val lockAt = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return !now.before(lockAt)
    }

    /** 다음 잠금 시각(ms). 오늘 lock day + 시간 지났으면 다음 lock day. */
    fun nextLockAtMillis(lockTime: String, lockDays: String): Long? {
        val parts = lockTime.trim().split(":")
        if (parts.size != 2) return null
        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null

        val cal = Calendar.getInstance()
        for (i in 0 until 8) {
            val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
            val isDay = dayMap.entries.any { it.value == dayOfWeek && lockDays.contains(it.key) }
            if (isDay) {
                val candidate = Calendar.getInstance().apply {
                    timeInMillis = cal.timeInMillis
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                if (candidate.timeInMillis > System.currentTimeMillis()) {
                    return candidate.timeInMillis
                }
            }
            cal.add(Calendar.DAY_OF_YEAR, 1)
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
        }
        return null
    }
}
