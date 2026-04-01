import React from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { settingsSharedStyles } from "./settingsSharedStyles";

export type SettingsLinkRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function SettingsLinkRow({
  title,
  subtitle,
  onPress,
  showChevron = true,
  titleStyle,
  subtitleStyle,
  style,
}: Readonly<SettingsLinkRowProps>) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[
        settingsSharedStyles.linkRow,
        { backgroundColor: colors.card },
        style,
      ]}
      onPress={onPress}
    >
      <View>
        <Text
          style={[
            settingsSharedStyles.rowTitle,
            { color: colors.text },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              settingsSharedStyles.rowSubtitle,
              { color: colors.textMuted },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}
