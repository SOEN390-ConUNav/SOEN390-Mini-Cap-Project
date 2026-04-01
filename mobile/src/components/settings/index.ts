/**
 * Settings UI composite: leaf components (cards, rows) compose into full screens.
 * Use `SettingsScreenScaffold` for the outer shell; use these for inner content.
 */
export { SettingsCard } from "./SettingsCard";
export { SettingsDivider } from "./SettingsDivider";
export { SettingsIconCircle } from "./SettingsIconCircle";
export { SettingsKeyValueRow } from "./SettingsKeyValueRow";
export { SettingsLabeledValueRow } from "./SettingsLabeledValueRow";
export { SettingsLegalBullet } from "./SettingsLegalText";
export { SettingsLegalLastUpdated } from "./SettingsLegalText";
export { SettingsLegalParagraph } from "./SettingsLegalText";
export { SettingsLegalSectionTitle } from "./SettingsLegalText";
export { SettingsLinkRow } from "./SettingsLinkRow";
export { SettingsOutlinedButton } from "./SettingsOutlinedButton";
export { SettingsPrimaryButton } from "./SettingsPrimaryButton";
export { SettingsRowHeader } from "./SettingsRowHeader";
export { SettingsSectionLabel } from "./SettingsSectionLabel";
export { SettingsStepCard } from "./SettingsStepCard";
export { SettingsSwitchRow } from "./SettingsSwitchRow";
export { useSettingsSwitchTrackColor } from "./useSettingsSwitchColors";
export { settingsSharedStyles } from "./settingsSharedStyles";

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
