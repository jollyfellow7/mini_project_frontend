import 'package:flutter/material.dart';

import 'screens/main_shell.dart';
import 'services/fcm_service.dart';
import 'services/lock_service.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  late final LockService _lockService;

  @override
  void initState() {
    super.initState();
    _lockService = LockService();
    _lockService.start();
    _initFcm();
  }

  Future<void> _initFcm() async {
    await FcmService.init(
      onMessage: (type) {
        if (!mounted) return;
        if (type == "lock") {
          _lockService.forceLock();
        } else if (type == "unlock") {
          _lockService.unlock();
        }
      },
    );
  }

  @override
  void dispose() {
    _lockService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MainShell(lockService: _lockService);
  }
}
