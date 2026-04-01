import React, { useEffect } from "react";
import { useNavigationSettings } from "../../hooks/useNavigationSettings";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsSectionLabel,
  SettingsSwitchRow,
} from "../../components/settings";

export default function SettingsNavigation() {
  const { avoidStairs, setAvoidStairs, hydrateFromStorage } =
    useNavigationSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <SettingsScreenScaffold title="Navigation">
      <SettingsCard>
        <SettingsSectionLabel>Route Preferences</SettingsSectionLabel>
        <SettingsSwitchRow
          title="Avoid Stairs"
          subtitle="Prefer routes with elevators and ramps."
          value={avoidStairs}
          onValueChange={setAvoidStairs}
        />
      </SettingsCard>
    </SettingsScreenScaffold>
  );
}
