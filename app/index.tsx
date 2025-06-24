import { View, Text, StyleSheet, Animated } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SplashScreen = () => {

    const fadeAnimation = React.useRef(new Animated.Value(0)).current;
    const scaleAnimation = React.useRef(new Animated.Value(0.5)).current;
    const router = useRouter()

    React.useEffect(() => {
        // Start the animations
        Animated.parallel([
            Animated.timing(fadeAnimation, {
                toValue: 1, 
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
                toValue: 1,
                tension: 10,
                friction: 2,
                useNativeDriver: true,
            }),
        ]).start();

       const timer = setTimeout(() => {
            router.push("/home"); // Navigate to the home screen after the animation
        }
           , 2000); // Adjust the duration as needed
        
        // Cleanup the timer on unmount
        return () => clearTimeout(timer);
    }
    , [fadeAnimation, scaleAnimation]);

  return (
    <View style={styles.container}>
      <Animated.View
              style={[styles.iconContainer, { 
                  opacity: fadeAnimation,
                  transform: [{ scale: scaleAnimation}]
         }]}
          >
              <Ionicons name="medical" size={100} color="#fff" />
      <Text style={styles.appName}>SplashScreen</Text>
              
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  iconContainer: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
      letterSpacing: 1,
    alignItems: "center",
    },
    appName: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "bold",
        marginTop: 10,
        letterSpacing: 1,
  }
});
