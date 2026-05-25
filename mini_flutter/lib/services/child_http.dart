import 'package:http/http.dart' as http;

import 'api_exception.dart';
import 'session_store.dart';

/// 자녀 API 401 시 세션 삭제 대신 토큰 갱신 후 1회 재시도
Future<http.Response> childAuthorizedRequest(
  Future<http.Response> Function(String token) request,
) async {
  var token = await SessionStore.getDeviceToken();
  if (token == null || token.isEmpty) throw ApiException('not_paired');

  var res = await request(token);
  if (res.statusCode != 401) return res;

  final refreshed = await PairService().refreshDeviceToken();
  if (!refreshed) throw ApiException('unauthorized');

  token = await SessionStore.getDeviceToken();
  if (token == null || token.isEmpty) throw ApiException('not_paired');
  res = await request(token);
  if (res.statusCode == 401) throw ApiException('unauthorized');
  return res;
}
