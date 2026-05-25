import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../config/api_config.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController(
      onPermissionRequest: (request) => request.grant(),
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF7F9FA))
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {},
        onPageFinished: (_) {},
        onWebResourceError: (_) {},
      ))
      ..loadRequest(Uri.parse(ApiConfig.childPwaUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
