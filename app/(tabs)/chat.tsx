// Using Firebase Auth types from the library to ensure compatibility
import { AUTH_ERROR, isAuthError } from "@/constants/AuthErrors";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Chat() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleAuthStateChanged = React.useCallback(
    (currentUser: FirebaseAuthTypes.User | null) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
      setLoginVisible(!currentUser);
      setIsLoading(false);
    },
    [initializing]
  );

  useEffect(() => {
    GoogleSignin.configure({
      // Web client ID (OAuth 2.0 client of type Web) from Google Cloud Console for this Firebase project
      webClientId:
        (Constants.expoConfig?.extra as any)?.googleWebClientId || undefined,
      // iOS client ID from GoogleService-Info.plist (optional but recommended)
      iosClientId:
        (Constants.expoConfig?.extra as any)?.googleIosClientId || undefined,
      // Android client ID from google-services.json (optional but recommended)
    });

    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return () => subscriber();
  }, [handleAuthStateChanged]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      setLoginVisible(false);
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      console.log("error", error);
      setIsLoading(false);
      if (isAuthError(error)) {
        switch (error.code) {
          case AUTH_ERROR.INVALID_EMAIL:
            Alert.alert("Error", "That email address is invalid!");
            break;
          case AUTH_ERROR.INVALID_CREDENTIAL:
          case AUTH_ERROR.WRONG_PASSWORD:
            Alert.alert("Error", "Incorrect email or password.");
            break;
          case AUTH_ERROR.USER_NOT_FOUND:
            Alert.alert("Error", "No account found with that email.");
            break;
          default:
            Alert.alert("Error", "Failed to sign in. Please try again.");
        }
      } else {
        Alert.alert("Error", "Failed to sign in. Please try again.");
      }
    }
  };

  const handleEmailRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(getAuth(), email, password);
      setLoginVisible(false);
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      setIsLoading(false);
      if (isAuthError(error)) {
        switch (error.code) {
          case AUTH_ERROR.EMAIL_ALREADY_IN_USE:
            Alert.alert("Error", "That email address is already in use!");
            break;
          case AUTH_ERROR.INVALID_EMAIL:
            Alert.alert("Error", "That email address is invalid!");
            break;
          case AUTH_ERROR.WEAK_PASSWORD:
            Alert.alert("Error", "Password is too weak.");
            break;
          default:
            Alert.alert("Error", "Failed to create account. Please try again.");
        }
      } else {
        Alert.alert("Error", "Failed to create account. Please try again.");
      }
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log("chay toi day==================>");
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      console.log("chay toi day==================> 2");
      if (!idToken) throw new Error("No ID token found");
      const googleCredential = GoogleAuthProvider.credential(idToken);

      await signInWithCredential(getAuth(), googleCredential);
      setLoginVisible(false);
    } catch (error) {
      console.log("error", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(getAuth());
      setMessages([]);
    } catch {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {user && (
        <View style={{ flex: 1 }}>
          <Text>{user?.email}</Text>

          <Button title="Sign Out" onPress={handleSignOut} />
        </View>
      )}

      <Modal visible={loginVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isRegistering ? "Create your account" : "Sign in to continue"}
            </Text>

            <TextInput
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
              onPress={isRegistering ? handleEmailRegister : handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isRegistering ? "Create account" : "Login"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>
                {isRegistering
                  ? "Already have an account? "
                  : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsRegistering((v) => !v)}>
                <Text style={styles.linkAction}>
                  {isRegistering ? "Sign in" : "Register"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, isLoading && styles.disabledBtn]}
              onPress={signInWithGoogle}
              disabled={isLoading}
            >
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  messageList: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  messageUser: {
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  or: {
    color: "#6b7280",
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  googleBtnText: {
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  linkText: {
    color: "#6b7280",
  },
  linkAction: {
    color: "#2563eb",
    fontWeight: "600",
  },
  signOut: {
    marginTop: 16,
    alignSelf: "center",
  },
  signOutText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
