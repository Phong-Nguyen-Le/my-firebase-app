export interface FirebaseUser {
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime: number; // Firebase JS SDK normally returns string, but here it's a timestamp
    lastSignInTime: number;
  };
  multiFactor: {
    enrolledFactors: any[]; // Replace `any` with MultiFactorInfo type if you import from Firebase types
  };
  phoneNumber: string | null;
  photoURL: string | null;
  providerData: any[]; // Replace with firebase.UserInfo[] if using SDK types
  providerId: string;
  refreshToken: string;
  tenantId: string | null;
  uid: string;
}
