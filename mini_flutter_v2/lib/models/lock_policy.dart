class LockPolicy {
  const LockPolicy({
    required this.lockTime,
    required this.lockDays,
    required this.passScore,
    required this.allowPhone,
    required this.allowlist,
  });

  final String lockTime;
  final String lockDays;
  final int passScore;
  final bool allowPhone;
  final List<String> allowlist;

  factory LockPolicy.fromJson(Map<String, dynamic> json) {
    return LockPolicy(
      lockTime: json['lock_time'] as String? ?? '17:00',
      lockDays: json['lock_days'] as String? ?? '월·수·금',
      passScore: (json['pass_score'] as num?)?.toInt() ?? 70,
      allowPhone: json['allow_phone'] as bool? ?? true,
      allowlist: (json['allowlist'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const ['dialer', 'com.chungsora.child'],
    );
  }

  /// OS Lock Task용 패키지·별칭 목록
  List<String> resolveAllowlist() {
    final out = <String>{'com.chungsora.child', ...allowlist};
    if (allowPhone) {
      out.add('dialer');
      out.add('com.android.emergency');
    }
    return out.toList();
  }
}
