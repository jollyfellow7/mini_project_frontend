class ApiException implements Exception {
  ApiException(this.code);
  final String code;
  @override
  String toString() => 'ApiException($code)';
}
