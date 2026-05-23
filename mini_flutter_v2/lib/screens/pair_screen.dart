import 'package:flutter/material.dart';

import '../services/lock_service.dart';
import '../services/session_store.dart';

class PairScreen extends StatefulWidget {
  const PairScreen({super.key, required this.lockService, this.relinkMode = false});

  final LockService lockService;
  final bool relinkMode;

  @override
  State<PairScreen> createState() => _PairScreenState();
}

class _PairScreenState extends State<PairScreen> {
  final _controller = TextEditingController();
  final _pairService = PairService();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    _pairService.close();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final result = await _pairService.verifyCode(_controller.text);
    if (!mounted) return;
    if (result.ok) {
      await widget.lockService.refreshAfterPair();
      if (mounted) Navigator.of(context).pop(true);
    } else {
      setState(() {
        _error = _reasonLabel(result.reason);
        _loading = false;
      });
    }
  }

  String _reasonLabel(String? reason) {
    switch (reason) {
      case 'invalid':
        return '코드가 올바르지 않습니다';
      case 'used':
        return '이미 사용된 코드입니다';
      case 'expired':
        return '코드가 만료되었습니다';
      default:
        return '연결에 실패했습니다 ($reason)';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.relinkMode ? '새 폰으로 연결' : '부모와 연결')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.relinkMode
                  ? '휴대폰을 바꾼 경우에만 사용하세요. 부모 앱에서 새 연결 코드를 받아 입력하면 됩니다. 기존 가족 연결은 그대로 유지돼요.'
                  : '부모 앱에서 발급한 페어링 코드를 입력하세요.',
              style: const TextStyle(color: Color(0xFF828C94), fontSize: 14),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _controller,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: '예: AB12CD',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                errorText: _error,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF00B8CF),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('연결하기'),
            ),
          ],
        ),
      ),
    );
  }
}
