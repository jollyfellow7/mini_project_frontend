/// 백엔드 API 베이스 URL — `--dart-define=API_BASE_URL=...`
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://43.201.95.108:8080',
  );

  static const String lockPolicyPath = '/api/v1/lock/policy';

  static const String childPwaUrl = String.fromEnvironment(
    'CHILD_PWA_URL',
    defaultValue: 'https://www.mini3.cloud/child',
  );
}

String resolveUploadUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  return '${ApiConfig.baseUrl}$path';
}
