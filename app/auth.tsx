import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const AuthScreen = () => {
  const [haseBiometric, setHasBiometric] = React.useState(false);

  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
    const [error, setError] = React.useState("");
    const router = useRouter()

  const checkBiometricSupport = async () => {
    try {
      const isSupported = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (isSupported && isEnrolled) {
        setHasBiometric(true);
      } else {
        setHasBiometric(false);
      }
    } catch (error) {
      console.error("Error checking biometric support:", error);
      return false;
    }
  };

  React.useEffect(() => {
    checkBiometricSupport();
  }, []); 
    
    const authenticate = async () => { 
        setIsAuthenticating(true);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasBiometrics = await LocalAuthentication.isEnrolledAsync();

        const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: hasBiometrics && hasHardware ? "Authenticate with Biometrics" : "Enter your PIN",
            fallbackLabel: "Enter PIN",
            cancelLabel: "Cancel",
            disableDeviceFallback: false,
        });
        setIsAuthenticating(false);
      if (auth.success) {
        // Handle successful authentication
          console.log("Authentication successful");
          router.push("/home"); // Navigate to the main app screen
      }
      else {
        // Handle failed authentication
        console.log("Authentication failed");
        setError("Authentication failed. Please try again.");
      }
    }

  return (
    <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={80} color="#fff" />
        </View>
        <Text style={styles.title}>Med Remind</Text>
        <Text style={styles.subtitle}>Your personal Medicaation Reminder</Text>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.instructionText}>
            {haseBiometric
              ? "You can use your biometric to login"
              : "Please login with your credentials"}
          </Text>
          <TouchableOpacity
            onPress={authenticate}
            style={[styles.button, isAuthenticating && styles.buttonDisabled]}
          >
            <Ionicons
              name={haseBiometric ? "finger-print-outline" : "keypad-outline"}
              size={24}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isAuthenticating
                ? "verifying..."
                : haseBiometric
                ? "Login with Biometric"
                : "Enter your PIN"}
            </Text>
          </TouchableOpacity>

          {error && (
            <View>
              <Ionicons name="alert-circle" size={20} color="red" />
              <Text style={{ color: "red" }}>{error}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: width - 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: {
    color: "#f44336",
    marginLeft: 8,
    fontSize: 14,
  },
});
