class LockPolicy {
  const LockPolicy({
    required this.lockTime,
    required this.lockDays,
    required this.passScore,
    required this.allowPhone,
    required this.allowlist,
    this.lockDates = const [],
    this.allowedNumbers = const [],
  });

  final String lockTime;
  final String lockDays;
  final int passScore;
  final bool allowPhone;
  final List<String> allowlist;
  final List<String> lockDates;
  final List<String> allowedNumbers;

  factory LockPolicy.fromJson(Map<String, dynamic> json) {
    return LockPolicy(
      lockTime: _parseStringOrDefault(json['lock_time'], '17:00'),
      lockDays: _parseStringOrDefault(json['lock_days'], '월·수·금'),
      passScore: (json['pass_score'] as num?)?.toInt() ?? 70,
      allowPhone: _parseBoolOrDefault(json['allow_phone'], true),
      allowlist: _parseStringList(
        json['allowlist'],
        fallback: const ['dialer', 'com.chungsora.child'],
      ),
      lockDates: _parseStringList(json['lock_dates'] ?? json['lockDates']),
      allowedNumbers: _parseStringList(
        json['allowed_numbers'] ?? json['allowedNumbers'],
      ),
    );
  }

  /// OS Lock Task용 패키지·별칭 목록
  List<String> resolveAllowlist() {
    final out = <String>{'com.chungsora.child', ...allowlist};
    if (allowPhone || allowedNumbers.isNotEmpty) {
      out.add('dialer');
      out.add('com.android.emergency');
    }
    return out.toList();
  }

  static String _parseStringOrDefault(dynamic raw, String fallback) {
    if (raw is! String) return fallback;
    final normalized = raw.trim();
    return normalized.isEmpty ? fallback : normalized;
  }

  static bool _parseBoolOrDefault(dynamic raw, bool fallback) {
    if (raw is bool) return raw;
    if (raw is num) return raw != 0;
    if (raw is String) {
      final normalized = raw.trim().toLowerCase();
      if (normalized == 'true' || normalized == '1' || normalized == 'yes') {
        return true;
      }
      if (normalized == 'false' || normalized == '0' || normalized == 'no') {
        return false;
      }
    }
    return fallback;
  }

  static List<String> _parseStringList(
    dynamic raw, {
    List<String> fallback = const [],
  }) {
    Iterable<dynamic> source;
    if (raw is List) {
      source = raw;
    } else if (raw is String) {
      source = raw.split(',');
    } else {
      return List<String>.from(fallback);
    }

    final out = <String>[];
    for (final item in source) {
      final value = item.toString().trim();
      if (value.isNotEmpty) {
        out.add(value);
      }
    }
    if (out.isEmpty && fallback.isNotEmpty) {
      return List<String>.from(fallback);
    }
    return out;
  }
}
