import 'package:chungsora_child/services/lock_scheduler.dart';
import 'package:chungsora_child/models/lock_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const scheduler = LockScheduler();

  LockPolicy policy({
    String time = '17:00',
    String days = '월·수·금',
    bool allowPhone = true,
    List<String> lockDates = const [],
    List<String> allowedNumbers = const [],
  }) =>
      LockPolicy(
        lockTime: time,
        lockDays: days,
        passScore: 70,
        allowPhone: allowPhone,
        allowlist: const ['dialer', 'com.chungsora.child'],
        lockDates: lockDates,
        allowedNumbers: allowedNumbers,
      );

  test('unlockedToday면 잠금 안 함', () {
    expect(scheduler.shouldLockNow(policy(), unlockedToday: true), isFalse);
  });

  test('lock_time 파싱 — 형식 오류', () {
    expect(
      scheduler.shouldLockNow(
        policy(time: 'invalid'),
        unlockedToday: false,
      ),
      isFalse,
    );
  });

  test('resolveAllowlist — 전화 허용', () {
    final list = policy(allowPhone: true).resolveAllowlist();
    expect(list, contains('dialer'));
    expect(list, contains('com.chungsora.child'));
  });

  test('lock_dates 오늘 포함 + 시간 경과면 잠금', () {
    final now = DateTime.now();
    final today = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    expect(
      scheduler.shouldLockNow(
        policy(
          time: '00:00',
          days: '',
          lockDates: [today],
        ),
        unlockedToday: false,
      ),
      isTrue,
    );
  });

  test('lock_dates가 있고 allow_phone=false여도 긴급 전화 패키지 허용', () {
    final list = policy(
      allowPhone: false,
      allowedNumbers: const ['112'],
    ).resolveAllowlist();
    expect(list, contains('dialer'));
    expect(list, contains('com.android.emergency'));
  });
}
