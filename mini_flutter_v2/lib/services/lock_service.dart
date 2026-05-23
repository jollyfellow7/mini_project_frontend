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
      _uiLocked = _status!.locked || _status!.lockTaskActive;
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
      allowlist: _policy!.allowlist,
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
      final shouldLock = pendingAuto ||
          _scheduler.shouldLockNow(_policy!, unlockedToday: unlockedToday);

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
    await LockBridge.stopLock();
    final prefs = await SharedPreferences.getInstance();
    final today = LockScheduler.todayKey();
    await prefs.setString(_unlockedDateKey, today);
    if (_policy != null) {
      await LockBridge.syncPolicy(
        lockTime: _policy!.lockTime,
        lockDays: _policy!.lockDays,
        allowlist: _policy!.allowlist,
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
