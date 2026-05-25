import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/lock_policy.dart';
import '../platform/lock_bridge.dart';
import 'lock_policy_client.dart';
import 'lock_scheduler.dart';
import 'session_store.dart';

/// BE lock/policy 폴링 → Lock Task(기기 전체 고정) → 미션 통과 시에만 해제
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
  bool _missionUiActive = false;
  bool _pendingUiLock = false;
  bool _polling = false;
  String? _lastError;
  Timer? _timer;
  DateTime? _lastTickAt;

  LockPolicy? get policy => _policy;
  LockStatus? get status => _status;
  bool get uiLocked => _uiLocked;
  bool get missionUiActive => _missionUiActive;
  bool get lockTaskActive => _status?.lockTaskActive ?? false;
  bool get deviceOwner => _status?.deviceOwner ?? false;
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
      final task = _status!.lockTaskActive;
      if (!_missionUiActive) {
        _uiLocked = task || _status!.locked || _pendingUiLock;
      }
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
      lockDates: _policy!.lockDates,
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
      final taskActive = _status?.lockTaskActive ?? false;

      if (shouldLock && !unlockedToday) {
        if (!taskActive) {
          await _applyNativeLock();
        }
        _uiLocked = !_missionUiActive;
      } else if (!shouldLock && taskActive) {
        await LockBridge.stopLock();
        _missionUiActive = false;
        _uiLocked = false;
      } else {
        _uiLocked = (taskActive || (_status?.locked ?? false)) && !_missionUiActive;
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

  /// Lock Task 유지 — Flutter 오버레이만 내리고 WebView에서 미션 진행
  Future<void> beginCleaningSession() async {
    _missionUiActive = true;
    _uiLocked = false;

    if (_policy != null) {
      final unlockedToday = await _isUnlockedToday();
      if (_scheduler.shouldLockNow(_policy!, unlockedToday: unlockedToday) &&
          !(_status?.lockTaskActive ?? false)) {
        await _applyNativeLock();
      }
    }
    notifyListeners();
  }

  Future<void> unlock() async {
    _missionUiActive = false;
    _pendingUiLock = false;
    await LockBridge.stopLock();
    final prefs = await SharedPreferences.getInstance();
    final today = LockScheduler.todayKey();
    await prefs.setString(_unlockedDateKey, today);
    if (_policy != null) {
      await LockBridge.syncPolicy(
        lockTime: _policy!.lockTime,
        lockDays: _policy!.lockDays,
        lockDates: _policy!.lockDates,
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

  /// 시연용 — Device Owner 없이 Flutter 잠금 UI 표시 (PWA 'lock' 메시지로 호출)
  Future<void> showUiLock() async {
    _missionUiActive = false;
    _pendingUiLock = true;
    _uiLocked = true;
    _lastError = null;
    notifyListeners();
  }

  Future<void> forceLock() async {
    _missionUiActive = false;
    _pendingUiLock = true;
    _policy ??= LockPolicy(
      lockTime: '00:00',
      lockDays: '월·화·수·목·금·토·일',
      passScore: 70,
      allowPhone: true,
      allowlist: const ['dialer', 'com.chungsora.child_v2'],
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
      allowlist: const ['dialer', 'com.chungsora.child_v2'],
    )).resolveAllowlist();
    try {
      await LockBridge.startLock(list);
      _lastError = null;
    } on PlatformException catch (e) {
      if (e.code == 'NOT_DEVICE_OWNER') {
        _lastError = 'NOT_DEVICE_OWNER';
        _uiLocked = true;
        return;
      }
      rethrow;
    }
    await _refreshStatus();
    if (!_missionUiActive) {
      _uiLocked = true;
    }
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
