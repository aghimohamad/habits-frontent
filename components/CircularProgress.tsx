import React from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  progress: number;
  total: number;
  completed: number;
  label: string;
  textColor?: string;
  subTextColor?: string;
  circleBg?: string;
  progressColor?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  progress,
  total,
  completed,
  label,
  textColor = "white",
  subTextColor = "#ffffffbe",
  circleBg = "rgba(255,255,255,0.2)",
  progressColor = "white",
}: CircularProgressProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const size = 200;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: progress / 100,
      useNativeDriver: true,
      damping: 15,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontWeight: "bold", fontSize: 32, color: "white" }}>
          {Math.round(progress)}%
        </Text>
        <Text style={{ fontSize: 12, color: subTextColor }}>
          {completed} of {total} {label}
        </Text>
      </View>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleBg}
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
}
