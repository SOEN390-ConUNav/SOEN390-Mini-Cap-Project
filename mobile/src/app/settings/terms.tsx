import React from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function SettingsTerms() {
  const { colors } = useTheme();

  return (
    <SettingsScreenScaffold title="Terms of Service">
      <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
        Last Updated: March 2, 2026
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        1. Introduction
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        Welcome to the ConUNav application (&quot;App&quot;) provided by
        Concordia University (&quot;University&quot;, &quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;). By downloading, installing, or
        using this App, you agree to be bound by these Terms of Service
        (&quot;Terms&quot;). If you do not agree to these Terms, please do not
        use the App.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        2. Acceptable Use
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        You agree to use the App only for lawful purposes and in accordance with
        these Terms. You agree not to use the App:
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • In any way that violates any applicable federal, provincial, local, or
        international law or regulation.
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • To transmit, or procure the sending of, any advertising or promotional
        material without our prior written consent.
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • To impersonate or attempt to impersonate the University, a University
        employee, another user, or any other person or entity.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        3. Location Services
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        The App uses location services to provide navigation and mapping
        features. By enabling location services, you consent to the collection,
        use, and sharing of your location data as described in our Privacy
        Policy. You may disable location services at any time through your
        device settings, but this may limit the functionality of the App.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        4. User Content
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        The App may allow you to submit feedback, report issues, or provide
        other content. By submitting any content, you grant the University a
        non-exclusive, worldwide, royalty-free license to use, reproduce,
        modify, and distribute such content for the purpose of improving the App
        and University services.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        5. Intellectual Property
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        The App and its entire contents, features, and functionality are owned
        by the University or its licensors and are protected by copyright,
        trademark, and other laws. You may use the App solely for personal,
        non-commercial purposes.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        6. Disclaimer of Warranties
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        The App is provided on an &quot;as is&quot; and &quot;as available&quot;
        basis. The University makes no representations or warranties of any
        kind, express or implied, regarding the operation or availability of the
        App, or the accuracy or reliability of any information provided.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        7. Limitation of Liability
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        To the fullest extent permitted by law, the University shall not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages arising out of or related to your use of, or inability to use,
        the App.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        8. Changes to These Terms
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        We may update these Terms from time to time. When we do, we will revise
        the &quot;Last Updated&quot; date above. Your continued use of the App
        after any changes constitutes your acceptance of the revised Terms.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        9. Contact
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        If you have questions about these Terms, please contact the course staff
        or project maintainers associated with ConUNav.
      </Text>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  lastUpdated: {
    fontSize: 13,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});
