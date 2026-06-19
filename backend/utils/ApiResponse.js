class ApiResponse {
  static success(data, message = 'Success', meta = {}) {
    // Merge meta properties (like pagination) directly into the root object if they exist
    return { success: true, data, message, ...meta, timestamp: new Date().toISOString() };
  }
  static error(message, code = 500, errors = []) {
    return { success: false, message, code, errors, timestamp: new Date().toISOString() };
  }
}

module.exports = ApiResponse;
