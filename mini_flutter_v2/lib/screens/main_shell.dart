import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config/api_config.dart';
import '../services/lock_service.dart';
import 'lock_screen.dart';

/// v2 메인 셸 — WebView(PWA) 항상 백그라운드 유지, 잠금 시 오버레이 표시
class MainShell extends StatefulWidget {
  final LockService lockService;
  const MainShell({super.key, required this.lockService});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF7F9FA))
      ..loadRequest(Uri.parse(ApiConfig.childPwaUrl));
  }

  /// 잠금 화면 "청소 시작" 버튼 — PWA 청소 경로로 이동 후 오버레이 숨김
  /// 실제 잠금 해제는 FCM "unlock" 메시지 수신 시
  void _onStartCleaning() {
    widget.lockService.beginCleaningSession();
    _controller.loadRequest(
      Uri.parse('${ApiConfig.childPwaUrl}/mission/before'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.lockService,
      builder: (context, _) {
        if (widget.lockService.uiLocked) {
          return LockScreen(
            lockService: widget.lockService,
            onStartCleaning: _onStartCleaning,
          );
        }
        return Scaffold(
          body: SafeArea(
            child: WebViewWidget(controller: _controller),
          ),
        );
      },
    );
  }
}
