/**
 * Settings UI composite: leaf components (cards, rows) compose into full screens.
 * Use `SettingsScreenScaffold` for the outer shell; use these for inner content.
 */
import { SettingsCard } from "./SettingsCard";
import { SettingsDivider } from "./SettingsDivider";
import { SettingsIconCircle } from "./SettingsIconCircle";
import { SettingsKeyValueRow } from "./SettingsKeyValueRow";
import { SettingsLabeledValueRow } from "./SettingsLabeledValueRow";
import {
  SettingsLegalBullet,
  SettingsLegalLastUpdated,
  SettingsLegalParagraph,
  SettingsLegalSectionTitle,
} from "./SettingsLegalText";
import { SettingsLinkRow } from "./SettingsLinkRow";
import { SettingsOutlinedButton } from "./SettingsOutlinedButton";
import { SettingsPrimaryButton } from "./SettingsPrimaryButton";
import { SettingsRowHeader } from "./SettingsRowHeader";
import { SettingsSectionLabel } from "./SettingsSectionLabel";
import { SettingsStepCard } from "./SettingsStepCard";
import { SettingsSwitchRow } from "./SettingsSwitchRow";
import { settingsSharedStyles } from "./settingsSharedStyles";
import { useSettingsSwitchTrackColor } from "./useSettingsSwitchColors";

export {
  SettingsCard,
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
  settingsSharedStyles,
};

/** Namespace export for composite-style usage: `SettingsContent.Card`, `SettingsContent.SwitchRow`, … */
export const SettingsContent = {
  Card: SettingsCard,
  Divider: SettingsDivider,
  IconCircle: SettingsIconCircle,
  KeyValueRow: SettingsKeyValueRow,
  LabeledValueRow: SettingsLabeledValueRow,
  LegalBullet: SettingsLegalBullet,
  LegalLastUpdated: SettingsLegalLastUpdated,
  LegalParagraph: SettingsLegalParagraph,
  LegalSectionTitle: SettingsLegalSectionTitle,
  LinkRow: SettingsLinkRow,
  OutlinedButton: SettingsOutlinedButton,
  PrimaryButton: SettingsPrimaryButton,
  RowHeader: SettingsRowHeader,
  SectionLabel: SettingsSectionLabel,
  StepCard: SettingsStepCard,
  SwitchRow: SettingsSwitchRow,
};
