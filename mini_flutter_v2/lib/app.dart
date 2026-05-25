import 'package:flutter/material.dart';

import 'app_shell.dart';

class ChungsoraChildApp extends StatelessWidget {
  const ChungsoraChildApp({super.key});

  static const _brand = Color(0xFF00B8CF);
  static const _text = Color(0xFF2F3438);
  static const _muted = Color(0xFF828C94);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '청소해라',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: _brand,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F9FA),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: _text,
          elevation: 0,
          centerTitle: true,
        ),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: _text, fontSize: 15),
          bodySmall: TextStyle(color: _muted, fontSize: 13),
        ),
        useMaterial3: true,
      ),
      home: const AppShell(),
    );
  }
}
