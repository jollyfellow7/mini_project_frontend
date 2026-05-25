import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM BG] type=${message.data["type"]}');
}

class FcmService {
  static final _messaging = FirebaseMessaging.instance;

  static Future<void> init({required void Function(String type) onMessage}) async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    final token = await _messaging.getToken();
    debugPrint('[FCM] token=$token');

    FirebaseMessaging.onMessage.listen((msg) {
      final type = msg.data['type'] as String?;
      if (type != null) onMessage(type);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((msg) {
      final type = msg.data['type'] as String?;
      if (type != null) onMessage(type);
    });
  }
}
