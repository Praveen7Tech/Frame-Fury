const STATUS_CODE = {
  // Success Codes
  OK: 200,
  CREATED: 201,

  // Client Error Codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,

  // Server Error Codes
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

module.exports = STATUS_CODE;