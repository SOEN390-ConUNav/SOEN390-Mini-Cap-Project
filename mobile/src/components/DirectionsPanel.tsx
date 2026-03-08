import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomDrawer from "./BottomDrawer";
import {
  IndoorDirectionResponse,
  IndoorRouteStep,
  IndoorManeuverType,
} from "../types/indoorDirections";

const BURGUNDY = "#800020";
const BURGUNDY_DARK = "#5a0016";
const BURGUNDY_HIGHLIGHT = "rgba(255,255,255,0.12)";

interface DirectionsPanelProps {
  routeData: IndoorDirectionResponse | null;
  visible: boolean;
  onClose: () => void;
}

function getIndoorManeuverIcon(
  maneuverType?: IndoorManeuverType,
): keyof typeof Ionicons.glyphMap {
  switch (maneuverType) {
    case "TURN_LEFT":
      return "arrow-undo";
    case "TURN_RIGHT":
      return "arrow-redo";
    case "TURN_AROUND":
      return "refresh";
    case "ELEVATOR_UP":
      return "arrow-up-circle";
    case "ELEVATOR_DOWN":
      return "arrow-down-circle";
    case "STAIRS_UP":
      return "trending-up";
    case "STAIRS_DOWN":
      return "trending-down";
    case "ESCALATOR_UP":
      return "trending-up";
    case "ESCALATOR_DOWN":
      return "trending-down";
    case "ENTER_ROOM":
      return "arrow-forward";
    case "EXIT_ROOM":
      return "arrow-back";
    case "ENTER_BUILDING":
      return "log-in";
    case "EXIT_BUILDING":
      return "log-out";
    case "ENTER_FLOOR":
      return "arrow-forward";
    case "EXIT_FLOOR":
      return "arrow-back";
    case "STRAIGHT":
    default:
      return "arrow-up";
  }
}

function PrimaryStep({ step }: { readonly step: IndoorRouteStep }) {
  return (
    <View style={styles.primaryCard}>
      <View style={styles.primaryIconWrap}>
        <Ionicons
          name={getIndoorManeuverIcon(step.maneuverType)}
          size={36}
          color="#fff"
        />
      </View>
      <View style={styles.primaryTextWrap}>
        <Text style={styles.primaryInstruction} numberOfLines={2}>
          {step.instruction}
        </Text>
        {step.distance ? (
          <Text style={styles.primaryMeta}>{step.distance}</Text>
        ) : null}
      </View>
    </View>
  );
}

function StepRow({ step }: { readonly step: IndoorRouteStep }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIconWrap}>
        <Ionicons
          name={getIndoorManeuverIcon(step.maneuverType)}
          size={20}
          color="#fff"
        />
      </View>
      <View style={styles.stepTextWrap}>
        <Text style={styles.stepInstruction} numberOfLines={2}>
          {step.instruction}
        </Text>
        {step.distance ? (
          <Text style={styles.stepMeta}>{step.distance}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function DirectionsPanel({
  routeData,
  visible,
  onClose,
}: Readonly<DirectionsPanelProps>) {
  const steps = routeData?.steps;
  if (!steps || steps.length === 0) return null;

  const [firstStep, ...remainingSteps] = steps;

  return (
    <BottomDrawer
      visible={visible}
      snapPoints={["16%", "45%", "75%"]}
      initialSnapIndex={1}
      useModal={false}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
      backgroundColor={BURGUNDY}
      handleMode="toggle"
      handleColor="rgba(255,255,255,0.4)"
      contentContainerStyle={styles.drawerContent}
      onClose={onClose}
    >
      <PrimaryStep step={firstStep} />

      {remainingSteps.length > 0 && (
        <ScrollView
          style={styles.stepList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {remainingSteps.map((step, index) => (
            <StepRow
              key={`step-${step.instruction.replaceAll(/\s+/g, "-")}-${index}`}
              step={step}
            />
          ))}
        </ScrollView>
      )}
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    paddingHorizontal: 4,
    paddingTop: 0,
    alignItems: "stretch",
  },

  primaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BURGUNDY_HIGHLIGHT,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
  },
  primaryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: BURGUNDY_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTextWrap: {
    flex: 1,
  },
  primaryInstruction: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  primaryMeta: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },

  stepList: {
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
    gap: 14,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BURGUNDY_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextWrap: {
    flex: 1,
  },
  stepInstruction: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  stepMeta: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginTop: 2,
  },
});
