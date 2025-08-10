import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

export const AUTH_ERROR = {
  INVALID_EMAIL: "auth/invalid-email",
  INVALID_CREDENTIAL: "auth/invalid-credential",
  WRONG_PASSWORD: "auth/wrong-password",
  USER_NOT_FOUND: "auth/user-not-found",
  EMAIL_ALREADY_IN_USE: "auth/email-already-in-use",
  WEAK_PASSWORD: "auth/weak-password",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR];

export function isAuthError(
  error: unknown
): error is FirebaseAuthTypes.NativeFirebaseAuthError & {
  code: AuthErrorCode | string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as any).code === "string" &&
    (error as any).code.startsWith("auth/")
  );
}
