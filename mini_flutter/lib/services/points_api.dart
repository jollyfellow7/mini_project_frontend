import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_exception.dart';
import 'child_http.dart';
import 'session_store.dart';

class PointsApi {
  PointsApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<Map<String, String>> _authHeaders() async {
    final token = await SessionStore.getDeviceToken();
    if (token == null) throw ApiException('not_paired');
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  Future<int> fetchBalance() async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/points/balance');
    final res = await childAuthorizedRequest(
      (token) => _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ),
    );
    if (res.statusCode != 200) throw ApiException('http_${res.statusCode}');
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return (body['balance'] as num?)?.toInt() ?? 0;
  }

  Future<int> earnPoints(double amount, String label) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/points/earn');
    final reqBody = jsonEncode({'amount': amount.round(), 'label': label});
    final res = await childAuthorizedRequest(
      (token) => _client.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: reqBody,
      ),
    );
    if (res.statusCode != 200) throw ApiException('http_${res.statusCode}');
    final resBody = jsonDecode(res.body) as Map<String, dynamic>;
    return (resBody['balance'] as num?)?.toInt() ?? 0;
  }

  Future<int> spendPoints(int won, String label) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/points/spend');
    final reqBody = jsonEncode({'won': won, 'label': label});
    final res = await childAuthorizedRequest(
      (token) => _client.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: reqBody,
      ),
    );
    if (res.statusCode != 200) throw ApiException('http_${res.statusCode}');
    final resBody = jsonDecode(res.body) as Map<String, dynamic>;
    return (resBody['balance'] as num?)?.toInt() ?? 0;
  }

  void close() => _client.close();
}

/// PWA tokens.ts calcCleaningPayout
class PayoutCalc {
  PayoutCalc._();

  static const wonPerP = 10;

  static ({int wonFromScore, double mult, int finalWon, double finalP}) calc(
    int baseWon,
    int score,
    int streakDays,
  ) {
    final wonFromScore = (baseWon * score / 100).floor();
    final mult = streakDays >= 14
        ? 2.0
        : streakDays >= 7
            ? 1.5
            : streakDays >= 3
                ? 1.25
                : 1.0;
    final finalWon = (wonFromScore * mult).round();
    return (
      wonFromScore: wonFromScore,
      mult: mult,
      finalWon: finalWon,
      finalP: finalWon / wonPerP,
    );
  }
}
