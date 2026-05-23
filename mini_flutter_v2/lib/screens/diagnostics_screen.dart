import 'package:flutter/material.dart';

import '../platform/lock_bridge.dart';
import '../services/lock_service.dart';

/// Phase 5 — 실기 E2E 진단 · 체크리스트
class DiagnosticsScreen extends StatefulWidget {
  const DiagnosticsScreen({super.key, required this.lockService});

  final LockService lockService;

  @override
  State<DiagnosticsScreen> createState() => _DiagnosticsScreenState();
}

class _DiagnosticsScreenState extends State<DiagnosticsScreen> {
  LockDiagnostics? _diag;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    await widget.lockService.forceSync();
    final d = await widget.lockService.fetchDiagnostics();
    if (mounted) setState(() { _diag = d; _loading = false; });
  }

  String _ts(int? ms) {
    if (ms == null || ms <= 0) return '—';
    return DateTime.fromMillisecondsSinceEpoch(ms).toLocal().toString().substring(0, 19);
  }

  @override
  Widget build(BuildContext context) {
    final d = _diag;
    final ls = widget.lockService;

    return Scaffold(
      appBar: AppBar(
        title: const Text('E2E 진단'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00B8CF)))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  '실기 검증 체크리스트',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Phase 5 — 아래 항목을 실기에서 하나씩 확인하세요.',
                  style: TextStyle(color: Color(0xFF828C94), fontSize: 13),
                ),
                const SizedBox(height: 16),
                _CheckRow('P5-1 Device Owner', d?.deviceOwner == true, 'adb dpm set-device-owner'),
                _CheckRow('P5-1 페어링', d?.paired == true, '부모 코드 입력'),
                _CheckRow('P5-2 감시 서비스', d?.monitorRunning == true, '17:00 자동 잠금'),
                _CheckRow('P5-5 배터리 예외', d?.batteryOptimized == true, '최적화 제외 필요'),
                _CheckRow('Lock Task', ls.status?.lockTaskActive == true, '잠금 중일 때'),
                const SizedBox(height: 16),
                _Card(
                  title: '네이티브 캐시',
                  lines: [
                    '스케줄: ${d?.cachedLockDays ?? "—"} · ${d?.cachedLockTime ?? "—"}',
                    'native shouldLock: ${d?.nativeShouldLock == true ? "YES" : "no"}',
                    '다음 알람: ${_ts(d?.nextAlarmAt)}',
                    '마지막 native tick: ${_ts(d?.lastNativeCheck)}',
                    '마지막 policy sync: ${_ts(d?.lastPolicySync)}',
                    'Flutter tick: ${ls.lastTickAt?.toString().substring(0, 19) ?? "—"}',
                  ],
                ),
                if (d != null && d.resolvedPackages.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _Card(
                    title: 'P5-3 화이트리스트 (설치된 패키지)',
                    lines: d.resolvedPackages,
                  ),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => widget.lockService.requestBatteryExemption(),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF00B8CF),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('배터리 최적화 제외 요청'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _refresh,
                  child: const Text('정책 · 진단 새로고침'),
                ),
                const SizedBox(height: 24),
                const Text(
                  'P5-4 재부팅 테스트: 잠금 상태에서 재부oot → 앱 자동 실행 · Lock Task 복구 확인',
                  style: TextStyle(color: Color(0xFF828C94), fontSize: 12),
                ),
              ],
            ),
    );
  }
}

class _CheckRow extends StatelessWidget {
  const _CheckRow(this.label, this.ok, this.hint);
  final String label;
  final bool ok;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(
            ok ? Icons.check_circle : Icons.radio_button_unchecked,
            color: ok ? const Color(0xFF00C73C) : const Color(0xFFADB5BD),
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(hint, style: const TextStyle(color: Color(0xFF828C94), fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.lines});
  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEAEDEF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ...lines.map(
            (l) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(l, style: const TextStyle(color: Color(0xFF828C94), fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}
