import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/lock_policy.dart';
import 'child_http.dart';
import 'session_store.dart';

class LockPolicyClient {
  LockPolicyClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<LockPolicy> fetchPolicy() async {
    final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.lockPolicyPath}');
    final res = await childAuthorizedRequest(
      (token) => _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ),
    );
    if (res.statusCode != 200) {
      throw LockPolicyException('http_${res.statusCode}');
    }

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return LockPolicy.fromJson(body);
  }

  void close() => _client.close();
}

class LockPolicyException implements Exception {
  LockPolicyException(this.code);
  final String code;

  @override
  String toString() => 'LockPolicyException($code)';
}
