import { registerForPushNotificationsAsync } from "@/utils/notifications";
import {
  DoseHistory,
  getMedications,
  getTodaysDoses,
  Medication,
  recordDose,
} from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

interface CircularProgressProps {
  progress: number;
  totalDoses: number;
  completedDoses: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress = ({
  progress,
  totalDoses,
  completedDoses,
}: CircularProgressProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = width * 0.55;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // animatedValue.setValue(0); // Reset the animation value
    Animated.timing(animatedValue, {
      toValue: progress / 100, // Normalize the progress value
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    // extrapolate: "clamp", // Prevent the animation from going beyond the specified range
  });

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 32,
            color: "white",
          }}
        >
          {Math.round(progress)}%
        </Text>
        <Text
          style={{
            fontWeight: "400",
            fontSize: 12,
            color: "#ffffffbe",
          }}
        >
          {completedDoses} of {totalDoses} doses
        </Text>
      </View>
      <Svg width={size} height={size} style={{}}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "Add\nMedication",
    route: "/medications/add" as const,
    color: "#2E7D32",
    gradient: ["#4CAF50", "#2E7D32"] as [string, string],
  },
  {
    icon: "calendar-outline" as const,
    label: "Calendar\nView",
    route: "/calendar" as const,
    color: "#1976D2",
    gradient: ["#2196F3", "#1976D2"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nLog",
    route: "/history" as const,
    color: "#C2185B",
    gradient: ["#E91E63", "#C2185B"] as [string, string],
  },
  {
    icon: "medical-outline" as const,
    label: "Refill\nTracker",
    route: "/refills" as const,
    color: "#E64A19",
    gradient: ["#FF5722", "#E64A19"] as [string, string],
  },
];

const Home = () => {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [todaysMedications, setTodaysMedications] = React.useState<
    Medication[]
  >([]);
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [doseHistory, setDoseHistory] = React.useState<DoseHistory[]>([]);
  const [completedDoses, setCompletedDoses] = React.useState(0);
  const loadMEdications = useCallback(async () => {
    await registerForPushNotificationsAsync();
    try {
      const [allMedications, todaysDoases] = await Promise.all([
        getMedications(),
        getTodaysDoses(),
      ]);
      setMedications(allMedications);
      setDoseHistory(todaysDoases);
      console.log("Loaded medications:", allMedications);
      const today = new Date();
      const todayMeds = allMedications.filter((med) => {
        const startDate = new Date(med.startDate);
        const durationDays = parseInt(med.duration);

        // For ongoing medications or if within duration
        if (
          durationDays === -1 ||
          (today >= startDate &&
            today <=
              new Date(
                startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
              ))
        ) {
          return true;
        }
        return false;
      });
      setTodaysMedications(todayMeds);

      const completed = todaysDoases.filter(
        (dose) => dose.taken === true && new Date(dose.timestamp).toDateString() === today.toDateString()
      ).length;
      setCompletedDoses(completed);
    } catch (error) {
      console.error("Error loading medications:", error);
    }
  }, []);

  useEffect(() => {
    // AsyncStorage.clear()
    loadMEdications();
  }, [loadMEdications]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = () => {
        // Cleanup if needed
      };

      loadMEdications();
      return () => unsubscribe();
    }, [loadMEdications])
  );

  const handleTakeDose = async (medication: Medication) => {
    try {
      await recordDose(medication.id, true, new Date().toISOString());
      await loadMEdications(); // Reload data after recording dose
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

    const progress =
    todaysMedications.length > 0
      ? (completedDoses / (todaysMedications.length )) * 100
      : 0;

  console.log("Progress:", progress);
  console.log('Completed Doses:', completedDoses);
  console.log('Total Doses:', todaysMedications.length);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#1a8e2d", "#146922"]}
        style={{
          paddingVertical: 30,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
        }}
      >
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 20,
            gap: 20,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              flex: 1,
              width: "100%",
            }}
          >
            {/* <View> */}
            <Text
              style={{
                color: "white",
                fontWeight: "semibold",
              }}
            >
              Daily Progress
            </Text>
            {/* </View> */}
            <TouchableOpacity
              style={{
                padding: 4,
                backgroundColor: "#ffffff2d",
                borderRadius: 10,
              }}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={"white"}
              />
            </TouchableOpacity>
          </View>
          <CircularProgress progress={progress} totalDoses={todaysMedications.length} completedDoses={completedDoses} />
        </View>
      </LinearGradient>
      <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 20, flex: 1 }}>
        {/* actions */}
        <View
          style={{
            gap: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 5,
            }}
          >
            Quick Actions
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Link href={action.route} asChild key={action.label}>
                <TouchableOpacity
                  key={action.label}
                  style={{
                    // flexBasis: "48%",
                    width: (width - 50) * 0.5,
                    height: 100,
                    backgroundColor: action.color,
                    borderRadius: 15,
                  }}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={{
                      width: "100%",
                      height: "100%",
                      flex: 1,
                      borderRadius: 15,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      padding: 15,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <Ionicons name={action.icon} size={28} color="white" />
                    </View>
                    <Text
                      style={{
                        color: "white",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      {action.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* today schedule */}
        <View
          style={{
            gap: 20,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 5,
              }}
            >
              Quick Actions
            </Text>
            <Link
              href="/home"
              style={{
                color: "#1a8e2d",
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              See All
            </Link>
          </View>

          {todaysMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No medications scheduled for today
              </Text>
              <Link href="/medications/add" asChild>
                <TouchableOpacity style={styles.addMedicationButton}>
                  <Text style={styles.addMedicationButtonText}>
                    Add Medication
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {todaysMedications.map((item) => {
                const taken = doseHistory.some(
                  (history) => history.medicationId === item.id && history.taken
                );

                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: "white",
                      padding: 15,
                      borderRadius: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      // marginBottom: 10,
                      gap: 10,
                      elevation: 3,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 40,
                        backgroundColor: item.color + "33",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 8,
                      }}
                    >
                      <Ionicons
                        name="medkit-outline"
                        size={20}
                        color={item.color}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "500",
                          color: "#1a1a1a",
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#666666a9",
                        }}
                      >
                        {item.dosage}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#666666a9",
                        }}
                      >
                        {item.times[0]}
                      </Text>
                    </View>
                    {taken ? (
                      <View style={[styles.takenBadge]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4CAF50"
                        />
                        <Text style={styles.takenText}>Taken</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.takeDoseButton,
                          { backgroundColor: item.color },
                        ]}
                        onPress={() => handleTakeDose(item)}
                      >
                        <Text style={styles.takeDoseText}>Take</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {todaysMedications.map((medication) => (
              <View key={medication.id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="medical" size={24} color={medication.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {medication.name}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {medication.dosage}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {medication.times[0]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 15,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    padding: 15,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 5,
  },
  seeAllButton: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  doseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  doseBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  doseInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  dosageInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  doseTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 5,
    color: "#666",
    fontSize: 14,
  },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginLeft: 10,
  },
  takeDoseText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  progressLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  progressRing: {
    transform: [{ rotate: "-90deg" }],
  },
  flex1: {
    flex: 1,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#146922",
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  progressDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 20,
  },
  addMedicationButton: {
    backgroundColor: "#1a8e2d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMedicationButtonText: {
    color: "white",
    fontWeight: "600",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  takenText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
});
