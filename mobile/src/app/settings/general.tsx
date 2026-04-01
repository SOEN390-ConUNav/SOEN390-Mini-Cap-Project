import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  useGeneralSettings,
  getCampusLabel,
} from "../../hooks/useGeneralSettings";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsKeyValueRow,
  SettingsLinkRow,
  SettingsPrimaryButton,
  SettingsSectionLabel,
} from "../../components/settings";

export default function SettingsGeneral() {
  const { defaultCampus, setDefaultCampus, hydrateFromStorage } =
    useGeneralSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const [cacheSize, setCacheSize] = useState("42.3 MB");
  const [offlineMapsSize, setOfflineMapsSize] = useState("128.7 MB");

  const onClearCache = () => {
    setCacheSize("0 MB");
    setOfflineMapsSize("0 MB");
    Alert.alert(
      "Cache cleared",
      "Stored map data and cache have been cleared.",
    );
  };

  return (
    <SettingsScreenScaffold title="General">
      <SettingsLinkRow
        title="Default Campus"
        subtitle={getCampusLabel(defaultCampus)}
        onPress={() => {
          Alert.alert("Default Campus", "Choose your default campus", [
            {
              text: "Sir George Williams Campus",
              onPress: () => setDefaultCampus("SGW"),
            },
            {
              text: "Loyola Campus",
              onPress: () => setDefaultCampus("LOYOLA"),
            },
            { text: "Cancel", style: "cancel" },
          ]);
        }}
      />

      <SettingsCard>
        <SettingsSectionLabel style={{ marginTop: 8 }}>
          Storage
        </SettingsSectionLabel>
        <SettingsKeyValueRow label="Cache Size" value={cacheSize} />
        <SettingsKeyValueRow label="Offline Maps" value={offlineMapsSize} />
        <SettingsPrimaryButton label="Clear Cache" onPress={onClearCache} />
      </SettingsCard>
    </SettingsScreenScaffold>
  );
}
