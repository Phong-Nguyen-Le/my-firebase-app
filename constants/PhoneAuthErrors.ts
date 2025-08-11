export const PHONE_AUTH_ERROR = {
  INVALID_PHONE_NUMBER: "auth/invalid-phone-number",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
  INTERNAL_ERROR: "auth/internal-error",
  QUOTA_EXCEEDED: "auth/quota-exceeded",
  OPERATION_NOT_ALLOWED: "auth/operation-not-allowed",
  INVALID_VERIFICATION_CODE: "auth/invalid-verification-code",
  SESSION_EXPIRED: "auth/session-expired",
} as const;

export const PHONE_AUTH_ERROR_MESSAGES = {
  [PHONE_AUTH_ERROR.INVALID_PHONE_NUMBER]: "Invalid phone number format. Please use international format (e.g., +44 7444 555666)",
  [PHONE_AUTH_ERROR.TOO_MANY_REQUESTS]: "Too many requests. Please try again later.",
  [PHONE_AUTH_ERROR.INTERNAL_ERROR]: "Firebase internal error. This usually means:\n\n1. Phone Authentication not enabled in Firebase Console\n2. Testing with real phone numbers (use test numbers)\n3. Firebase project configuration issue\n\nPlease check Firebase Console settings.",
  [PHONE_AUTH_ERROR.QUOTA_EXCEEDED]: "SMS quota exceeded. Please try again later or contact support.",
  [PHONE_AUTH_ERROR.OPERATION_NOT_ALLOWED]: "Phone Authentication is not enabled. Please enable it in Firebase Console.",
  [PHONE_AUTH_ERROR.INVALID_VERIFICATION_CODE]: "Invalid verification code. Please check and try again.",
  [PHONE_AUTH_ERROR.SESSION_EXPIRED]: "Verification session expired. Please request a new SMS.",
} as const;

export const isPhoneAuthError = (error: any): error is { code: string; message: string } => {
  return error && typeof error.code === 'string' && error.code.startsWith('auth/');
};
