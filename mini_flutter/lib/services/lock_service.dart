import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/lock_policy.dart';
import '../platform/lock_bridge.dart';
import 'lock_policy_client.dart';
import 'lock_scheduler.dart';
import 'session_store.dart';

/// BE lock/policy 폴링 → 스케줄 판단 → native LockPlugin · 백그라운드 감시
class LockService extends ChangeNotifier {
  LockService({
    LockPolicyClient? policyClient,
    LockScheduler? scheduler,
  })  : _policyClient = policyClient ?? LockPolicyClient(),
        _scheduler = scheduler ?? const LockScheduler();

  final LockPolicyClient _policyClient;
  final LockScheduler _scheduler;

  static const _unlockedDateKey = 'unlocked_date';

  LockPolicy? _policy;
  LockStatus? _status;
  bool _uiLocked = false;
  // Device Owner 가 아닐 때(시연/수동 잠금) UI 오버레이를 유지하기 위한 의도 플래그.
  // _refreshStatus() 가 native 상태로 _uiLocked 를 덮어써도 이 값으로 잠금을 지킨다.
  // 인메모리라 앱 재시작 시 해제됨(데모용으로 적절). unlock() 에서 해제.
  bool _pendingUiLock = false;
  bool _polling = false;
  String? _lastError;
  Timer? _timer;
  DateTime? _lastTickAt;

  LockPolicy? get policy => _policy;
  LockStatus? get status => _status;
  bool get uiLocked => _uiLocked;
  String? get lastError => _lastError;
  bool get isPaired => _paired;
  DateTime? get lastTickAt => _lastTickAt;
  bool _paired = false;

  Future<void> start() async {
    _paired = await SessionStore.isPaired();
    await _refreshStatus();
    if (_paired) {
      await LockBridge.startMonitor();
    }
    await _tick();
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _tick());
    notifyListeners();
  }

  Future<void> refreshAfterPair() async {
    _paired = true;
    await LockBridge.startMonitor();
    await _tick();
    notifyListeners();
  }

  /// JWT 만료 등으로 세션이 무효화된 뒤 UI·폴링 상태 정리
  void forceUnpaired() {
    _paired = false;
    _policy = null;
    notifyListeners();
  }

  Future<LockDiagnostics> fetchDiagnostics() => LockBridge.getDiagnostics();

  Future<void> requestBatteryExemption() => LockBridge.requestBatteryExemption();

  Future<void> forceSync() => _tick();

  Future<void> _refreshStatus() async {
    try {
      _status = await LockBridge.getStatus();
      _uiLocked = _status!.locked || _status!.lockTaskActive || _pendingUiLock;
    } catch (e) {
      _lastError = e.toString();
    }
  }

  Future<void> _syncNativePolicy() async {
    if (_policy == null) return;
    final prefs = await SharedPreferences.getInstance();
    final unlocked = prefs.getString(_unlockedDateKey) ?? '';
    await LockBridge.syncPolicy(
      lockTime: _policy!.lockTime,
      lockDays: _policy!.lockDays,
      allowlist: _policy!.resolveAllowlist(),
      allowPhone: _policy!.allowPhone,
      unlockedDate: unlocked,
      paired: _paired,
    );
  }

  Future<void> _tick() async {
    await _refreshStatus();
    _lastTickAt = DateTime.now();

    if (!_paired) {
      notifyListeners();
      return;
    }

    if (_polling) return;
    _polling = true;

    try {
      final pendingAuto = await LockBridge.consumePendingAutoLock();

      _policy = await _policyClient.fetchPolicy();
      _lastError = null;
      await _syncNativePolicy();

      final unlockedToday = await _isUnlockedToday();
      // 오늘 이미 통과/언락했으면 native 가 큐에 쌓아둔 pendingAuto 가 남아있어도
      // 재잠금하지 않는다. (통과 직후 다시 잠겨 청소를 또 요구하는 문제 방지)
      final shouldLock = !unlockedToday &&
          (pendingAuto ||
              _scheduler.shouldLockNow(_policy!, unlockedToday: unlockedToday));

      if (shouldLock && !(_status?.lockTaskActive ?? false)) {
        await _applyNativeLock();
      } else if (!shouldLock && (_status?.lockTaskActive ?? false)) {
        await LockBridge.stopLock();
        _uiLocked = false;
      } else if ((_status?.locked ?? false) && !(_status?.lockTaskActive ?? false)) {
        await _applyNativeLock();
      } else {
        _uiLocked = _status?.lockTaskActive ?? false;
      }

      await _refreshStatus();
    } on LockPolicyException catch (e) {
      _lastError = e.code;
      if (e.code == 'not_paired') {
        _paired = false;
      } else if (e.code == 'unauthorized') {
        final ok = await PairService().refreshDeviceToken();
        if (ok) {
          await _tick();
          return;
        }
        _lastError = 'token_refresh_failed';
      }
    } on PlatformException catch (e) {
      _lastError = e.message ?? e.code;
    } catch (e) {
      _lastError = e.toString();
    } finally {
      _polling = false;
      notifyListeners();
    }
  }

  Future<void> unlock() async {
    _pendingUiLock = false;
    await LockBridge.stopLock();
    final prefs = await SharedPreferences.getInstance();
    final today = LockScheduler.todayKey();
    await prefs.setString(_unlockedDateKey, today);
    if (_policy != null) {
      await LockBridge.syncPolicy(
        lockTime: _policy!.lockTime,
        lockDays: _policy!.lockDays,
        allowlist: _policy!.resolveAllowlist(),
        allowPhone: _policy!.allowPhone,
        unlockedDate: today,
        paired: _paired,
      );
    }
    _uiLocked = false;
    await _refreshStatus();
    notifyListeners();
  }

  Future<void> forceLock() async {
    _pendingUiLock = true;
    _policy ??= LockPolicy(
      lockTime: '00:00',
      lockDays: '월·화·수·목·금·토·일',
      passScore: 70,
      allowPhone: true,
      allowlist: const ['dialer', 'com.chungsora.child'],
    );
    try {
      await _applyNativeLock();
      _lastError = null;
    } on PlatformException catch (e) {
      _lastError = e.message ?? e.code;
    } catch (e) {
      _lastError = e.toString();
    }
    await _refreshStatus();
    notifyListeners();
  }

  Future<void> requestDeviceAdmin() async {
    await LockBridge.requestAdmin();
  }

  Future<void> _applyNativeLock() async {
    final list = (_policy ?? LockPolicy(
      lockTime: '17:00',
      lockDays: '월·수·금',
      passScore: 70,
      allowPhone: true,
      allowlist: const ['dialer', 'com.chungsora.child'],
    )).resolveAllowlist();
    try {
      await LockBridge.startLock(list);
    } on PlatformException catch (e) {
      if (e.code == 'NOT_DEVICE_OWNER') {
        _uiLocked = true;
        return;
      }
      rethrow;
    }
    _uiLocked = true;
  }

  Future<bool> _isUnlockedToday() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_unlockedDateKey) == LockScheduler.todayKey();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _policyClient.close();
    super.dispose();
  }
}
