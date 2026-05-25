import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/lock_service.dart';

/// 잠금 ON — PWA /child/lock 과 동일 UX
class LockScreen extends StatelessWidget {
  const LockScreen({
    super.key,
    required this.lockService,
    required this.onStartCleaning,
  });

  final LockService lockService;
  final VoidCallback onStartCleaning;

  @override
  Widget build(BuildContext context) {
    final policy = lockService.policy;
    final lockTime = policy?.lockTime ?? '17:00';
    final allowPhone = policy?.allowPhone ?? true;
    final deviceOwner = lockService.deviceOwner;
    final lockTask = lockService.lockTaskActive;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: const Color(0xFF2F3438),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF04452),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    '잠금 ON',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text('🔒', style: TextStyle(fontSize: 48)),
                const SizedBox(height: 16),
                const Text(
                  '방 청소하면 폰이 풀려요',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '유튜브 · 게임 · 카톡 차단됨 · $lockTime부터',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                ),
                if (allowPhone) ...[
                  const SizedBox(height: 12),
                  Text(
                    '전화 · 긴급번호는 사용 가능',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 12,
                    ),
                  ),
                ],
                if (!deviceOwner) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF04452).withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '기기 전체 잠금(Lock Task)을 쓰려면\nDevice Owner 설정이 필요합니다.\n(ADB provisioning — docs/DEVICE_OWNER_SETUP.md)',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 11, height: 1.4),
                    ),
                  ),
                ] else if (lockTask) ...[
                  const SizedBox(height: 12),
                  Text(
                    '다른 앱은 사용할 수 없어요',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onStartCleaning,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF00B8CF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      '청소 시작',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
