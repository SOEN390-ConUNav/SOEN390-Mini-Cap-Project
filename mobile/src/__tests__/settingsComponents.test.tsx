import React from "react";
import { Text, View, Switch } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import {
  SettingsCard,
  SettingsContent,
  SettingsDivider,
  SettingsIconCircle,
  SettingsKeyValueRow,
  SettingsLabeledValueRow,
  SettingsLegalBullet,
  SettingsLegalLastUpdated,
  SettingsLegalParagraph,
  SettingsLegalSectionTitle,
  SettingsLinkRow,
  SettingsOutlinedButton,
  SettingsPrimaryButton,
  SettingsRowHeader,
  SettingsSectionLabel,
  SettingsStepCard,
  SettingsSwitchRow,
  useSettingsSwitchTrackColor,
} from "../components/settings";

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#fff",
      card: "#f5f5f5",
      text: "#111",
      textMuted: "#666",
      primary: "#800020",
      border: "#ddd",
      surface: "#eee",
    },
    isDark: false,
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const { Text: T } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => <T>{name}</T> };
});

function HookProbe() {
  const track = useSettingsSwitchTrackColor();
  return <Text testID="track-false">{String(track["false"])}</Text>;
}

describe("settings barrel and SettingsContent", () => {
  it("SettingsContent maps to the same component references as named exports", () => {
    expect(SettingsContent.Card).toBe(SettingsCard);
    expect(SettingsContent.SwitchRow).toBe(SettingsSwitchRow);
    expect(SettingsContent.LinkRow).toBe(SettingsLinkRow);
    expect(SettingsContent.RowHeader).toBe(SettingsRowHeader);
    expect(SettingsContent.SectionLabel).toBe(SettingsSectionLabel);
    expect(SettingsContent.Divider).toBe(SettingsDivider);
    expect(SettingsContent.KeyValueRow).toBe(SettingsKeyValueRow);
    expect(SettingsContent.LabeledValueRow).toBe(SettingsLabeledValueRow);
    expect(SettingsContent.PrimaryButton).toBe(SettingsPrimaryButton);
    expect(SettingsContent.OutlinedButton).toBe(SettingsOutlinedButton);
    expect(SettingsContent.LegalLastUpdated).toBe(SettingsLegalLastUpdated);
    expect(SettingsContent.LegalSectionTitle).toBe(SettingsLegalSectionTitle);
    expect(SettingsContent.LegalParagraph).toBe(SettingsLegalParagraph);
    expect(SettingsContent.LegalBullet).toBe(SettingsLegalBullet);
    expect(SettingsContent.StepCard).toBe(SettingsStepCard);
    expect(SettingsContent.IconCircle).toBe(SettingsIconCircle);
  });
});

describe("useSettingsSwitchTrackColor", () => {
  it("returns border and primary for switch track", () => {
    const { getByTestId } = render(<HookProbe />);
    expect(getByTestId("track-false").props.children).toBe("#ddd");
  });
});

describe("SettingsCard", () => {
  it("renders children inside themed card", () => {
    const { getByText } = render(
      <SettingsCard>
        <Text>Inside</Text>
      </SettingsCard>,
    );
    expect(getByText("Inside")).toBeTruthy();
  });
});

describe("SettingsSwitchRow", () => {
  it("renders inline layout with subtitle and calls onValueChange", () => {
    const onValueChange = jest.fn();
    const { getByText, UNSAFE_getByType } = render(
      <SettingsSwitchRow
        title="Title"
        subtitle="Sub"
        value={false}
        onValueChange={onValueChange}
      />,
    );
    expect(getByText("Title")).toBeTruthy();
    expect(getByText("Sub")).toBeTruthy();
    fireEvent(UNSAFE_getByType(Switch), "valueChange", true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("renders subtitleBelow layout", () => {
    const { getByText } = render(
      <SettingsSwitchRow
        title="Push"
        subtitle="Details"
        value
        onValueChange={jest.fn()}
        subtitleBelow
      />,
    );
    expect(getByText("Push")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
  });
});

describe("SettingsLinkRow", () => {
  it("invokes onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SettingsLinkRow title="Go" subtitle="Hint" onPress={onPress} />,
    );
    fireEvent.press(getByText("Go"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("SettingsRowHeader", () => {
  it("shows title and value label", () => {
    const { getByText } = render(
      <SettingsRowHeader title="Brightness" valueLabel="80%" />,
    );
    expect(getByText("Brightness")).toBeTruthy();
    expect(getByText("80%")).toBeTruthy();
  });
});

describe("SettingsSectionLabel", () => {
  it("renders label text", () => {
    const { getByText } = render(
      <SettingsSectionLabel>Section</SettingsSectionLabel>,
    );
    expect(getByText("Section")).toBeTruthy();
  });
});

describe("SettingsKeyValueRow", () => {
  it("renders label and value", () => {
    const { getByText } = render(
      <SettingsKeyValueRow label="Cache" value="10 MB" />,
    );
    expect(getByText("Cache")).toBeTruthy();
    expect(getByText("10 MB")).toBeTruthy();
  });
});

describe("SettingsLabeledValueRow", () => {
  it("renders title, subtitle, and value", () => {
    const { getByText } = render(
      <SettingsLabeledValueRow
        title="Font Size"
        subtitle="Bigger text"
        valueLabel="Large"
      />,
    );
    expect(getByText("Font Size")).toBeTruthy();
    expect(getByText("Bigger text")).toBeTruthy();
    expect(getByText("Large")).toBeTruthy();
  });
});

describe("SettingsPrimaryButton and SettingsOutlinedButton", () => {
  it("PrimaryButton calls onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SettingsPrimaryButton label="Clear" onPress={onPress} />,
    );
    fireEvent.press(getByText("Clear"));
    expect(onPress).toHaveBeenCalled();
  });

  it("OutlinedButton calls onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SettingsOutlinedButton label="Skip" onPress={onPress} />,
    );
    fireEvent.press(getByText("Skip"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("SettingsLegalText", () => {
  it("renders legal primitives", () => {
    const { getByText } = render(
      <View>
        <SettingsLegalLastUpdated>Updated Jan 1</SettingsLegalLastUpdated>
        <SettingsLegalSectionTitle>1. Section</SettingsLegalSectionTitle>
        <SettingsLegalParagraph>Body</SettingsLegalParagraph>
        <SettingsLegalBullet>• Item</SettingsLegalBullet>
      </View>,
    );
    expect(getByText("Updated Jan 1")).toBeTruthy();
    expect(getByText("1. Section")).toBeTruthy();
    expect(getByText("Body")).toBeTruthy();
    expect(getByText("• Item")).toBeTruthy();
  });
});

describe("SettingsStepCard", () => {
  it("renders step header and body", () => {
    const { getByText } = render(
      <SettingsStepCard
        stepLabel="Step 1"
        title="Do thing"
        icon="settings-outline"
      >
        <Text>Instructions</Text>
      </SettingsStepCard>,
    );
    expect(getByText("Step 1")).toBeTruthy();
    expect(getByText("Do thing")).toBeTruthy();
    expect(getByText("settings-outline")).toBeTruthy();
    expect(getByText("Instructions")).toBeTruthy();
  });
});

describe("SettingsIconCircle", () => {
  it("renders icon name from Ionicons mock", () => {
    const { getByText } = render(
      <SettingsIconCircle name="location-outline" />,
    );
    expect(getByText("location-outline")).toBeTruthy();
  });
});

describe("SettingsDivider", () => {
  it("renders without throwing inside a card", () => {
    const { getByText } = render(
      <SettingsCard>
        <Text>Above</Text>
        <SettingsDivider />
        <Text>Below</Text>
      </SettingsCard>,
    );
    expect(getByText("Above")).toBeTruthy();
    expect(getByText("Below")).toBeTruthy();
  });
});
