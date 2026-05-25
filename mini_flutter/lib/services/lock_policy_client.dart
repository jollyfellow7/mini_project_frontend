import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/lock_policy.dart';
import 'api_exception.dart';
import 'child_http.dart';

class LockPolicyClient {
  LockPolicyClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<LockPolicy> fetchPolicy() async {
    try {
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
    } on ApiException catch (e) {
      throw LockPolicyException(e.code);
    }
  }

  void close() => _client.close();
}

class LockPolicyException implements Exception {
  LockPolicyException(this.code);
  final String code;

  @override
  String toString() => 'LockPolicyException($code)';
}
