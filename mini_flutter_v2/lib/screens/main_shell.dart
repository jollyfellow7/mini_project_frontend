import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config/api_config.dart';
import '../services/lock_service.dart';
import 'lock_screen.dart';

/// WebView(PWA) + Lock Task — 잠금 시 다른 앱 사용 불가, 앱 안에서만 청소 미션
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
    final lock = widget.lockService;
    _controller = WebViewController(
      // 청소 촬영용 카메라·마이크 권한 요청 자동 허용 (Android WebView)
      onPermissionRequest: (request) => request.grant(),
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF7F9FA))
      ..addJavaScriptChannel(
        'ChungsoraNative',
        onMessageReceived: (msg) {
          switch (msg.message) {
            case 'lock':
              lock.showUiLock();
              break;
            case 'unlock':
              lock.unlock();
              break;
            case 'missionStart':
              lock.beginCleaningSession();
              break;
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (url) => _onPwaNavigated(url),
        ),
      )
      ..loadRequest(Uri.parse(ApiConfig.childPwaUrl));
  }

  void _onPwaNavigated(String url) {
    if (url.contains('/mission/') ||
        url.contains('/child/dirty') ||
        url.contains('/child/after')) {
      widget.lockService.beginCleaningSession();
    }
  }

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
        final showLockOverlay =
            widget.lockService.uiLocked && !widget.lockService.missionUiActive;

        return Stack(
          fit: StackFit.expand,
          children: [
            Scaffold(
              body: SafeArea(
                child: WebViewWidget(controller: _controller),
              ),
            ),
            if (showLockOverlay)
              LockScreen(
                lockService: widget.lockService,
                onStartCleaning: _onStartCleaning,
              ),
          ],
        );
      },
    );
  }
}
