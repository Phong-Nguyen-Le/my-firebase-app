import {
  COUNTRY_CODES,
  CountryCode,
  getDefaultCountry,
} from "@/constants/CountryCodes";
import {
  PHONE_AUTH_ERROR,
  PHONE_AUTH_ERROR_MESSAGES,
  isPhoneAuthError,
} from "@/constants/PhoneAuthErrors";
import {
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from "@react-native-firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PhoneSignIn() {
  // If null, no SMS has been sent
  const [confirm, setConfirm] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    getDefaultCountry()
  );
  const [phoneNumber, setPhoneNumber] = useState("7444 555666");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [phoneError, setPhoneError] = useState<string>("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Get full phone number with country code
  const getFullPhoneNumber = (): string => {
    return selectedCountry.dialCode + phoneNumber.replace(/\s/g, "");
  };

  // Phone number validation function
  const validatePhoneNumber = (
    phone: string
  ): { isValid: boolean; error: string } => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Check if it starts with +
    if (!cleanPhone.startsWith("+")) {
      return { isValid: false, error: "Phone number must start with +" };
    }

    // Check if it has a country code (at least 2 digits after +)
    if (cleanPhone.length < 3) {
      return { isValid: false, error: "Phone number too short" };
    }

    // Check if it has enough digits for a valid phone number (minimum 7 digits total)
    const digitCount = cleanPhone.replace(/[^\d]/g, "").length;
    if (digitCount < 7) {
      return { isValid: false, error: "Phone number too short" };
    }

    // Check if it's not too long (maximum 15 digits total)
    if (digitCount > 15) {
      return { isValid: false, error: "Phone number too long" };
    }

    return { isValid: true, error: "" };
  };

  // Handle phone number input change
  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    const fullNumber = getFullPhoneNumber();
    const validation = validatePhoneNumber(fullNumber);
    setPhoneError(validation.error);
    setIsPhoneValid(validation.isValid);
  };

  // Handle country selection
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    // Re-validate with new country code
    const fullNumber = country.dialCode + phoneNumber.replace(/\s/g, "");
    const validation = validatePhoneNumber(fullNumber);
    setPhoneError(validation.error);
    setIsPhoneValid(validation.isValid);
  };

  // Handle login
  function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (user) {
      // User is signed in
      console.log("User signed in:", user.phoneNumber);
      // Reset the confirmation state
      setConfirm(null);
      setVerificationCode("");
    } else {
      // User is signed out
      console.log("User signed out");
    }
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Handle the button press
  async function handleSignInWithPhoneNumber() {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    if (!isPhoneValid) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    const fullNumber = getFullPhoneNumber();
    setIsLoading(true);
    try {
      console.log("Attempting to send SMS to:", fullNumber);
      console.log("Firebase Auth instance:", getAuth());

      const confirmation = await signInWithPhoneNumber(getAuth(), fullNumber);

      console.log("SMS sent successfully, confirmation:", confirmation);
      setConfirm(confirmation);
      Alert.alert(
        "Success",
        "SMS sent! Please check your phone for the verification code."
      );
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to send SMS. Please try again.";
      let shouldRetry = false;

      if (isPhoneAuthError(error)) {
        switch (error.code) {
          case PHONE_AUTH_ERROR.INVALID_PHONE_NUMBER:
            errorMessage =
              PHONE_AUTH_ERROR_MESSAGES[PHONE_AUTH_ERROR.INVALID_PHONE_NUMBER];
            break;
          case PHONE_AUTH_ERROR.TOO_MANY_REQUESTS:
            errorMessage =
              PHONE_AUTH_ERROR_MESSAGES[PHONE_AUTH_ERROR.TOO_MANY_REQUESTS];
            break;
          case PHONE_AUTH_ERROR.INTERNAL_ERROR:
            errorMessage =
              PHONE_AUTH_ERROR_MESSAGES[PHONE_AUTH_ERROR.INTERNAL_ERROR];
            shouldRetry = true;
            break;
          case PHONE_AUTH_ERROR.QUOTA_EXCEEDED:
            errorMessage =
              PHONE_AUTH_ERROR_MESSAGES[PHONE_AUTH_ERROR.QUOTA_EXCEEDED];
            break;
          case PHONE_AUTH_ERROR.OPERATION_NOT_ALLOWED:
            errorMessage =
              PHONE_AUTH_ERROR_MESSAGES[PHONE_AUTH_ERROR.OPERATION_NOT_ALLOWED];
            break;
          default:
            errorMessage = `SMS failed: ${error.message || "Unknown error"}`;
            shouldRetry = true;
        }
      }

      Alert.alert(
        "SMS Error",
        errorMessage,
        shouldRetry
          ? [
              { text: "OK" },
              { text: "Retry", onPress: () => handleSignInWithPhoneNumber() },
            ]
          : undefined
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmCode() {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (!confirm) {
      Alert.alert(
        "Error",
        "No confirmation available. Please request a new SMS."
      );
      return;
    }

    setIsLoading(true);
    try {
      await confirm.confirm(verificationCode.trim());
      Alert.alert("Success", "Phone number verified successfully!");
    } catch (error: any) {
      console.error("Error confirming code:", error);
      let errorMessage = "Invalid verification code. Please try again.";

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === "auth/session-expired") {
        errorMessage =
          "Verification session expired. Please request a new SMS.";
        setConfirm(null);
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to test with a known working phone number
  const testWithTestNumber = () => {
    setPhoneNumber("7444 555666"); // Test number that should work
    setSelectedCountry(getDefaultCountry());
    const validation = validatePhoneNumber(getFullPhoneNumber());
    setPhoneError(validation.error);
    setIsPhoneValid(validation.isValid);
  };

  // Function to check Firebase configuration
  const checkFirebaseConfig = () => {
    try {
      const auth = getAuth();
      console.log("Firebase Auth Config:", {
        app: auth.app.name,
        currentUser: auth.currentUser,
        config: auth.app.options,
      });

      Alert.alert(
        "Firebase Config",
        `App: ${auth.app.name}\nCurrent User: ${
          auth.currentUser ? "Signed In" : "Not Signed In"
        }\nCheck console for full config`
      );
    } catch (error) {
      console.error("Error checking Firebase config:", error);
      Alert.alert("Error", "Failed to check Firebase configuration");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
      Alert.alert("Success", "Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  // Country Picker Modal
  const CountryPickerModal = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.countryList}>
            {COUNTRY_CODES.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.countryItem,
                  selectedCountry.code === country.code &&
                    styles.selectedCountry,
                ]}
                onPress={() => handleCountrySelect(country)}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // If user is signed in, show success message
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Phone Sign-In Successful!</Text>
          <Text style={styles.subtitle}>Phone: {user.phoneNumber}</Text>
          <Text style={styles.subtitle}>UID: {user.uid}</Text>

          <Button title="Sign Out" onPress={handleSignOut} />
        </View>
      </SafeAreaView>
    );
  }

  // If no SMS has been sent yet, show phone input
  if (!confirm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Phone Number Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code
          </Text>

          {/* Country Code Selector */}
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryDialCode}>
              {selectedCountry.dialCode}
            </Text>
            <Text style={styles.countryName}>{selectedCountry.name}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phoneInputLabel}>Phone Number</Text>
            <TextInput
              style={[
                styles.phoneInput,
                phoneError ? styles.inputError : null,
                isPhoneValid ? styles.inputValid : null,
              ]}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Text style={styles.fullNumberPreview}>
              Full number: {getFullPhoneNumber()}
            </Text>
          </View>

          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : isPhoneValid ? (
            <Text style={styles.validText}>✓ Valid phone number</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Sending SMS..." : "Send SMS"}
              onPress={handleSignInWithPhoneNumber}
              disabled={isLoading || !isPhoneValid}
            />

            <Button
              title="Test with Test Number"
              onPress={testWithTestNumber}
              color="#007AFF"
            />

            <Button
              title="Check Firebase Config"
              onPress={checkFirebaseConfig}
              color="#34C759"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.infoTitle}>Troubleshooting Tips:</Text>
            <Text>• Use test phone numbers for development</Text>
            <Text>• Enable Phone Authentication in Firebase Console</Text>
            <Text>• Check your Firebase project settings</Text>
            <Text>• Real phone numbers may not work in development</Text>
          </View>
        </View>

        <CountryPickerModal />
      </SafeAreaView>
    );
  }

  // If SMS has been sent, show verification code input
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>We sent a code to {phoneNumber}</Text>

        <TextInput
          style={styles.input}
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          autoCapitalize="none"
          maxLength={6}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? "Verifying..." : "Verify Code"}
            onPress={confirmCode}
            disabled={isLoading}
          />

          <Button
            title="Resend SMS"
            onPress={() => setConfirm(null)}
            disabled={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    gap: 15,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  inputError: {
    borderColor: "red",
    borderWidth: 2,
  },
  inputValid: {
    borderColor: "green",
    borderWidth: 2,
  },
  validText: {
    color: "green",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#444",
  },
  // New styles for country picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  countryList: {
    maxHeight: 250,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedCountry: {
    backgroundColor: "#e0e0e0",
  },
  countryInfo: {
    flex: 1,
  },
  phoneInputContainer: {
    marginTop: 20,
  },
  phoneInputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  fullNumberPreview: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  countryDialCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  countryName: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 20,
    color: "#666",
  },
});
