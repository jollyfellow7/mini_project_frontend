import 'package:flutter/services.dart';

class LockStatus {
  const LockStatus({
    required this.deviceOwner,
    required this.adminActive,
    required this.lockTaskActive,
    required this.locked,
  });

  final bool deviceOwner;
  final bool adminActive;
  final bool lockTaskActive;
  final bool locked;

  factory LockStatus.fromMap(Map<dynamic, dynamic> map) {
    return LockStatus(
      deviceOwner: map['deviceOwner'] as bool? ?? false,
      adminActive: map['adminActive'] as bool? ?? false,
      lockTaskActive: map['lockTaskActive'] as bool? ?? false,
      locked: map['locked'] as bool? ?? false,
    );
  }
}

class LockDiagnostics {
  const LockDiagnostics({
    required this.deviceOwner,
    required this.monitorRunning,
    required this.batteryOptimized,
    required this.nativeShouldLock,
    required this.paired,
    this.nextAlarmAt,
    this.lastNativeCheck,
    this.lastPolicySync,
    this.cachedLockTime,
    this.cachedLockDays,
    this.resolvedPackages = const [],
  });

  final bool deviceOwner;
  final bool monitorRunning;
  final bool batteryOptimized;
  final bool nativeShouldLock;
  final bool paired;
  final int? nextAlarmAt;
  final int? lastNativeCheck;
  final int? lastPolicySync;
  final String? cachedLockTime;
  final String? cachedLockDays;
  final List<String> resolvedPackages;

  factory LockDiagnostics.fromMap(Map<dynamic, dynamic> map) {
    return LockDiagnostics(
      deviceOwner: map['deviceOwner'] as bool? ?? false,
      monitorRunning: map['monitorRunning'] as bool? ?? false,
      batteryOptimized: map['batteryOptimized'] as bool? ?? false,
      nativeShouldLock: map['nativeShouldLock'] as bool? ?? false,
      paired: map['paired'] as bool? ?? false,
      nextAlarmAt: (map['nextAlarmAt'] as num?)?.toInt(),
      lastNativeCheck: (map['lastNativeCheck'] as num?)?.toInt(),
      lastPolicySync: (map['lastPolicySync'] as num?)?.toInt(),
      cachedLockTime: map['cachedLockTime'] as String?,
      cachedLockDays: map['cachedLockDays'] as String?,
      resolvedPackages: (map['resolvedPackages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }
}

class LockBridge {
  LockBridge._();

  static const _channel = MethodChannel('com.chungsora.child/lock');

  static Future<bool> isDeviceOwner() async {
    return await _channel.invokeMethod<bool>('isDeviceOwner') ?? false;
  }

  static Future<LockStatus> getStatus() async {
    final map = await _channel.invokeMethod<Map<dynamic, dynamic>>('getStatus');
    return LockStatus.fromMap(map ?? {});
  }

  static Future<LockDiagnostics> getDiagnostics() async {
    final map = await _channel.invokeMethod<Map<dynamic, dynamic>>('getDiagnostics');
    return LockDiagnostics.fromMap(map ?? {});
  }

  static Future<void> requestAdmin() async {
    await _channel.invokeMethod<void>('requestAdmin');
  }

  static Future<void> startLock(List<String> allowlist) async {
    await _channel.invokeMethod<void>('startLock', {'allowlist': allowlist});
  }

  static Future<void> stopLock() async {
    await _channel.invokeMethod<void>('stopLock');
  }

  static Future<void> syncPolicy({
    required String lockTime,
    required String lockDays,
    String lockDates = '',
    required List<String> allowlist,
    required bool allowPhone,
    required String unlockedDate,
    required bool paired,
  }) async {
    await _channel.invokeMethod<void>('syncPolicy', {
      'lockTime': lockTime,
      'lockDays': lockDays,
      'lockDates': lockDates,
      'allowlist': allowlist,
      'allowPhone': allowPhone,
      'unlockedDate': unlockedDate,
      'paired': paired,
    });
  }

  static Future<void> startMonitor() async {
    await _channel.invokeMethod<void>('startMonitor');
  }

  static Future<bool> consumePendingAutoLock() async {
    return await _channel.invokeMethod<bool>('consumePendingAutoLock') ?? false;
  }

  static Future<bool> isIgnoringBatteryOptimizations() async {
    return await _channel.invokeMethod<bool>('isIgnoringBatteryOptimizations') ?? true;
  }

  static Future<void> requestBatteryExemption() async {
    await _channel.invokeMethod<void>('requestBatteryExemption');
  }
}
