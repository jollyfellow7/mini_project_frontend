import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/cleaning_slots.dart';
import '../services/cleaning_api.dart';
import '../services/cleaning_orchestrator.dart';
import '../services/cleaning_session.dart';
import '../services/lock_service.dart';
import '../services/points_api.dart';
import 'unlock_result_screen.dart';

/// dirty → quest → after → AI 검증 → 잠금 해제
class CleaningFlowScreen extends StatefulWidget {
  const CleaningFlowScreen({super.key, required this.lockService});

  final LockService lockService;

  @override
  State<CleaningFlowScreen> createState() => _CleaningFlowScreenState();
}

class _CleaningFlowScreenState extends State<CleaningFlowScreen> {
  final _session = CleaningSession();
  final _picker = ImagePicker();
  final _orchestrator = CleaningOrchestrator();
  final _cleaningApi = CleaningApi();
  final _pointsApi = PointsApi();
  bool _busy = false;

  @override
  void dispose() {
    _orchestrator.close();
    _cleaningApi.close();
    _pointsApi.close();
    _session.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto(CleaningPhase mode) async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      imageQuality: 85,
    );
    if (file == null || !mounted) return;

    final bytes = await file.readAsBytes();
    final idx = _session.slotIndex;
    _session.setCapture(mode, idx, bytes);

    try {
      setState(() => _busy = true);
      final phase = mode == CleaningPhase.dirty ? 'before' : 'after';
      await _cleaningApi.uploadLogPhoto(
        date: todayLogDate(),
        phase: phase,
        slot: idx,
        bytes: bytes,
      );
    } catch (_) {
      // 업로드 실패해도 AI 플로우는 계속
    } finally {
      if (mounted) setState(() => _busy = false);
    }

    if (idx < CleaningSlots.count - 1) {
      _session.nextSlot();
      return;
    }

    if (mode == CleaningPhase.dirty) {
      await _runDirtyScan();
    } else {
      await _runAfterVerify();
    }
  }

  Future<void> _runDirtyScan() async {
    _session.setPhase(CleaningPhase.scanning);
    setState(() => _busy = true);
    try {
      final captures = _session.dirtyCaptures.map((c) => c!).toList();
      final res = await _orchestrator.scanAllSlots(captures);
      _session.setScanResult(
        labels: res.questLabels.isEmpty ? ['방 정리', '바닥 닦기', '책상 정리'] : res.questLabels,
        pollution: res.pollutionLevel,
        summary: res.summary,
      );
      _session.resetSlotIndex();
    } on OrchestratorException catch (e) {
      _session.setError(e.messageKo());
      _session.setPhase(CleaningPhase.dirty);
      _session.resetSlotIndex();
    } catch (e) {
      _session.setError('스캔 실패: $e');
      _session.setPhase(CleaningPhase.dirty);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _runAfterVerify() async {
    _session.setPhase(CleaningPhase.verifying);
    setState(() => _busy = true);
    try {
      final captures = _session.afterCaptures.map((c) => c!).toList();
      // AI 채점만 실패했을 때 '청소 후 촬영'으로 되돌려 재시도하게 한다.
      final res = await _orchestrator.compareAllAfterSlots(captures);

      // 결과 확정. 이 시점 이후의 부수효과(서버 기록·포인트 적립·언락)가 실패해도
      // 결과 화면을 'after' 로 되돌리지 않는다.
      // (통과했는데 다시 청소 후 촬영 단계로 튕기는 문제의 핵심 원인)
      _session.setVerifyResult(
        score: res.cleanliness,
        comment: res.comment,
        pass: res.passScore,
        baseWon: res.baseCleanWon,
        streak: res.streakDays,
      );

      try {
        await _cleaningApi.patchLogMeta(
          date: todayLogDate(),
          score: res.cleanliness,
          streakDays: res.streakDays,
        );
      } catch (_) {
        // 로그 기록 실패는 무시 — 결과는 이미 확정됨
      }

      if (res.passed) {
        try {
          final payout = PayoutCalc.calc(res.baseCleanWon, res.cleanliness, res.streakDays);
          final earnedP = payout.finalP.round().clamp(1, 10000);
          await _pointsApi.earnPoints(earnedP.toDouble(), '청소 완료 · AI ${res.cleanliness}점');
        } catch (_) {
          // 포인트 적립 실패는 무시
        }
        try {
          await widget.lockService.unlock();
        } catch (_) {
          // 언락 호출이 실패해도 결과 화면은 유지
        }
      }
    } on OrchestratorException catch (e) {
      _session.setError(e.messageKo());
      _session.setPhase(CleaningPhase.after);
      _session.resetSlotIndex();
    } catch (e) {
      _session.setError('검증 실패: $e');
      _session.setPhase(CleaningPhase.after);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _startAfterPhase() {
    _session.setPhase(CleaningPhase.after);
    _session.resetSlotIndex();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _session,
      builder: (context, _) {
        if (_session.phase == CleaningPhase.result) {
          return UnlockResultScreen(
            session: _session,
            onDone: () {
              // 통과 후 [홈] 탭으로 복귀.
              // reset()을 먼저 부르면 phase가 촬영 단계로 바뀌며 촬영 화면이
              // 다시 그려져 "촬영 화면으로 튕기는" 버그가 생긴다.
              // 그래서 reset 없이 청소 플로우 라우트를 전부 닫아 MainShell(홈)로 돌아간다.
              // (세션은 화면 dispose 시 정리됨)
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            onRetry: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (_) => CleaningFlowScreen(lockService: widget.lockService),
                ),
              );
            },
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(_titleForPhase(_session.phase)),
            leading: _busy
                ? null
                : IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _buildBody(),
            ),
          ),
        );
      },
    );
  }

  String _titleForPhase(CleaningPhase p) {
    switch (p) {
      case CleaningPhase.dirty:
        return '청소 전 촬영';
      case CleaningPhase.scanning:
        return 'AI 스캔 중…';
      case CleaningPhase.quest:
        return '청소 퀘스트';
      case CleaningPhase.after:
        return '청소 후 촬영';
      case CleaningPhase.verifying:
        return 'AI 검증 중…';
      case CleaningPhase.result:
        return '결과';
    }
  }

  Widget _buildBody() {
    if (_busy || _session.phase == CleaningPhase.scanning || _session.phase == CleaningPhase.verifying) {
      return _LoadingPanel(
        message: _session.phase == CleaningPhase.scanning
            ? 'Gemini AI가 더러운 곳을 찾는 중…'
            : 'baseline과 비교 채점 중… (최대 2분)',
      );
    }

    if (_session.error != null) {
      return _ErrorPanel(
        message: _session.error!,
        onRetry: () => _session.clearError(),
      );
    }

    switch (_session.phase) {
      case CleaningPhase.dirty:
      case CleaningPhase.after:
        return _CapturePanel(
          session: _session,
          mode: _session.phase,
          onCapture: () => _capturePhoto(_session.phase),
        );
      case CleaningPhase.quest:
        return _QuestPanel(
          session: _session,
          onContinue: _session.allQuestDone ? _startAfterPhase : null,
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _LoadingPanel extends StatelessWidget {
  const _LoadingPanel({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: Color(0xFF00B8CF)),
          const SizedBox(height: 24),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF828C94))),
        ],
      ),
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.error_outline, color: Color(0xFFF04452), size: 48),
        const SizedBox(height: 16),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 24),
        FilledButton(onPressed: onRetry, child: const Text('다시 시도')),
      ],
    );
  }
}

class _CapturePanel extends StatelessWidget {
  const _CapturePanel({
    required this.session,
    required this.mode,
    required this.onCapture,
  });

  final CleaningSession session;
  final CleaningPhase mode;
  final VoidCallback onCapture;

  @override
  Widget build(BuildContext context) {
    final idx = session.slotIndex;
    final label = CleaningSlots.labels[idx];
    final captures = mode == CleaningPhase.dirty ? session.dirtyCaptures : session.afterCaptures;
    final preview = captures[idx];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${idx + 1} / ${CleaningSlots.count} · $label',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          mode == CleaningPhase.dirty
              ? '더러운 상태를 촬영해 주세요'
              : '청소 후 같은 각도로 촬영해 주세요 (부모 baseline과 비교)',
          style: const TextStyle(color: Color(0xFF828C94), fontSize: 14),
        ),
        const SizedBox(height: 24),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFEAEDEF),
              borderRadius: BorderRadius.circular(16),
            ),
            clipBehavior: Clip.antiAlias,
            child: preview != null
                ? Image.memory(Uint8List.fromList(preview), fit: BoxFit.cover)
                : const Center(child: Icon(Icons.camera_alt_outlined, size: 64, color: Color(0xFFADB5BD))),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            for (var i = 0; i < CleaningSlots.count; i++)
              Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < 2 ? 6 : 0),
                  decoration: BoxDecoration(
                    color: captures[i] != null ? const Color(0xFF00B8CF) : const Color(0xFFEAEDEF),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: onCapture,
          icon: const Icon(Icons.camera_alt),
          label: Text(preview == null ? '촬영하기' : (idx < 2 ? '다음 구역' : '완료 · AI 전송')),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF00B8CF),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
      ],
    );
  }
}

class _QuestPanel extends StatelessWidget {
  const _QuestPanel({required this.session, required this.onContinue});

  final CleaningSession session;
  final VoidCallback? onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '오염도 ${session.pollutionLevel}%',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFFF04452)),
        ),
        if (session.scanSummary.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(session.scanSummary, style: const TextStyle(color: Color(0xFF828C94), fontSize: 13)),
        ],
        const SizedBox(height: 20),
        const Text('퀘스트를 완료하고 체크하세요', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.builder(
            itemCount: session.questItems.length,
            itemBuilder: (context, i) {
              final q = session.questItems[i];
              return CheckboxListTile(
                value: q.done,
                onChanged: (_) => session.toggleQuest(q.id),
                title: Text(q.label),
                activeColor: const Color(0xFF00B8CF),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                tileColor: Colors.white,
              );
            },
          ),
        ),
        FilledButton(
          onPressed: onContinue,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF00B8CF),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: const Text('청소 후 촬영하기'),
        ),
      ],
    );
  }
}
