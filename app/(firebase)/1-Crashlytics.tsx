import {
  crash,
  getCrashlytics,
  log,
  recordError,
  setCrashlyticsCollectionEnabled,
} from "@react-native-firebase/crashlytics";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

const Crashlytics = () => {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    checkCrashlyticsStatus();
  }, []);

  const checkCrashlyticsStatus = async () => {
    try {
      const crashlytics = getCrashlytics();
      const isEnabled = crashlytics.isCrashlyticsCollectionEnabled;
      setEnabled(isEnabled);
      setStatus(`Crashlytics is ${isEnabled ? "enabled" : "disabled"}`);
      // Log current status for debugging
      console.log("Crashlytics status:", isEnabled);
      console.log("Firebase config:", crashlytics.app.options);
    } catch (error) {
      console.error("Error checking Crashlytics status:", error);
      setStatus("Error checking status");
    }
  };

  async function toggleCrashlytics() {
    try {
      const crashlytics = getCrashlytics();
      const newEnabled = !enabled;

      console.log("Setting Crashlytics to:", newEnabled);
      await setCrashlyticsCollectionEnabled(crashlytics, newEnabled);

      // Verify the change
      const updatedStatus = crashlytics.isCrashlyticsCollectionEnabled;
      setEnabled(updatedStatus);
      setStatus(`Crashlytics is ${updatedStatus ? "enabled" : "disabled"}`);

      console.log("Crashlytics updated to:", updatedStatus);

      // Log a test message
      log(
        crashlytics,
        `Crashlytics ${
          newEnabled ? "enabled" : "disabled"
        } at ${new Date().toISOString()}`
      );

      Alert.alert(
        "Success",
        `Crashlytics ${newEnabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("Error toggling Crashlytics:", error);
      Alert.alert("Error", "Failed to toggle Crashlytics");
    }
  }

  const testCrash = () => {
    Alert.alert("Test Crash", "This will crash your app. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Crash",
        style: "destructive",
        onPress: () => {
          console.log("Triggering test crash...");
          const crashlytics = getCrashlytics();
          log(crashlytics, "About to crash the app for testing");
          crash(crashlytics);
        },
      },
    ]);
  };

  // Function that triggers an error and crashes the app
  const triggerErrorAndCrash = () => {
    Alert.alert(
      "Trigger Error & Crash",
      "This will log an error and then crash the app. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger Error & Crash",
          style: "destructive",
          onPress: () => {
            try {
              const crashlytics = getCrashlytics();

              // Log context messages (these will appear in crash reports)
              log(crashlytics, "Starting error simulation process");
              log(
                crashlytics,
                `User triggered error at: ${new Date().toISOString()}`
              );

              // Record multiple types of errors for testing
              const customError = new Error(
                "User triggered test error for Crashlytics testing"
              );
              customError.name = "TestCrashlyticsError";
              recordError(crashlytics, customError, "TestError");
              setTest("abc123123");
            } catch (error) {
              console.error("Error in triggerErrorAndCrash:", error);
              const crashlytics = getCrashlytics();
              recordError(crashlytics, error as Error);
              crash(crashlytics);
            }
          },
        },
      ]
    );
  };

  // Function that logs a non-fatal error without crashing
  const logNonFatalError = () => {
    try {
      const crashlytics = getCrashlytics();

      // Create different types of errors for testing
      const nonFatalError = new Error("This is a non-fatal error for testing");
      nonFatalError.name = "NonFatalTestError";
      recordError(crashlytics, nonFatalError, "NonFatalError");

      // Log a message (this will appear in future crash reports)
      log(crashlytics, "Non-fatal error logged successfully");

      // Record another error to show multiple errors
      const secondError = new Error("Second non-fatal error for testing");
      secondError.name = "SecondTestError";
      recordError(crashlytics, secondError, "SecondError");

      Alert.alert("Success", "Multiple non-fatal errors logged to Crashlytics");
    } catch (error) {
      console.error("Error logging non-fatal error:", error);
      Alert.alert("Error", "Failed to log non-fatal error");
    }
  };

  // Function to demonstrate different error types
  const logVariousErrors = () => {
    try {
      const crashlytics = getCrashlytics();

      // Network error simulation
      const networkError = new Error("Failed to fetch data from API");
      networkError.name = "NetworkError";
      recordError(crashlytics, networkError, "NetworkError");

      // Validation error
      const validationError = new Error("Invalid user input data");
      validationError.name = "ValidationError";
      recordError(crashlytics, validationError, "ValidationError");

      // Database error
      const dbError = new Error("Database connection failed");
      dbError.name = "DatabaseError";
      recordError(crashlytics, dbError, "DatabaseError");

      log(crashlytics, "Multiple error types logged for testing");

      Alert.alert("Success", "Various error types logged to Crashlytics");
    } catch (error) {
      console.error("Error logging various errors:", error);
      Alert.alert("Error", "Failed to log various errors");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>

      <Button title="Toggle Crashlytics" onPress={toggleCrashlytics} />
      <Button title="Test Crash" onPress={testCrash} />
      <Button title="Log Non-Fatal Error" onPress={logNonFatalError} />
      <Button
        title="Trigger Error & Crash"
        onPress={triggerErrorAndCrash}
        color="#ff4444"
      />

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Crashlytics Testing:</Text>
        <Text>• Toggle Crashlytics: Enable/disable crash reporting</Text>
        <Text>• Test Crash: Immediate app crash</Text>
        <Text>• Log Non-Fatal Error: Log error without crashing</Text>
        <Text>• Trigger Error & Crash: Log error then crash</Text>
        <Text style={styles.warning}>⚠️ Crashes will close your app!</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Troubleshooting Tips:</Text>
        <Text>• Make sure you're using a release build</Text>
        <Text>• Check Firebase console for your project</Text>
        <Text>• Verify Google Services files are correct</Text>
        <Text>• Wait 5-10 minutes for reports to appear</Text>
      </View>
    </View>
  );
};

export default Crashlytics;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  info: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  warning: {
    color: "#ff4444",
    fontWeight: "bold",
    marginTop: 5,
  },
});
