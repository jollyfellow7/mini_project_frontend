import '../models/lock_policy.dart';

/// lock_time · lock_days · lock_dates 기준 잠금 시각 판단 (로컬 타임존)
class LockScheduler {
  const LockScheduler();

  static const _dayMap = {
    '월': DateTime.monday,
    '화': DateTime.tuesday,
    '수': DateTime.wednesday,
    '목': DateTime.thursday,
    '금': DateTime.friday,
    '토': DateTime.saturday,
    '일': DateTime.sunday,
  };

  bool shouldLockNow(LockPolicy policy, {required bool unlockedToday}) {
    if (unlockedToday) return false;
    final scheduledByDay = _isLockDay(policy.lockDays);
    final scheduledByDate = _isLockDate(policy.lockDates);
    if (!scheduledByDay && !scheduledByDate) return false;
    return _isPastLockTime(policy.lockTime);
  }

  bool _isLockDay(String lockDays) {
    final today = DateTime.now().weekday;
    final parts = lockDays.split('·').map((s) => s.trim()).where((s) => s.isNotEmpty);
    for (final part in parts) {
      if (_dayMap[part] == today) return true;
    }
    return false;
  }

  bool _isLockDate(List<String> lockDates) {
    if (lockDates.isEmpty) return false;
    final now = DateTime.now();
    for (final raw in lockDates) {
      final date = _tryParseDate(raw);
      if (date == null) continue;
      if (_isSameDate(date, now)) return true;
    }
    return false;
  }

  DateTime? _tryParseDate(String value) {
    final text = value.trim();
    if (text.isEmpty) return null;

    final parsed = DateTime.tryParse(text);
    if (parsed != null) return parsed.toLocal();

    final match = RegExp(r'^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$').firstMatch(text);
    if (match == null) return null;

    final year = int.parse(match.group(1)!);
    final month = int.parse(match.group(2)!);
    final day = int.parse(match.group(3)!);
    return DateTime(year, month, day);
  }

  bool _isSameDate(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  bool _isPastLockTime(String lockTime) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(lockTime.trim());
    if (match == null) return false;
    final hour = int.parse(match.group(1)!);
    final minute = int.parse(match.group(2)!);
    final now = DateTime.now();
    final lockAt = DateTime(now.year, now.month, now.day, hour, minute);
    return !now.isBefore(lockAt);
  }

  /// 자정에 unlockedToday 플래그 리셋용 키 (yyyy-MM-dd)
  static String todayKey() {
    final n = DateTime.now();
    return '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
  }
}
