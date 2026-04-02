import React from "react";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsLegalBullet,
  SettingsLegalLastUpdated,
  SettingsLegalParagraph,
  SettingsLegalSectionTitle,
} from "../../components/settings";

export default function SettingsTerms() {
  return (
    <SettingsScreenScaffold title="Terms of Service">
      <SettingsLegalLastUpdated>
        Last Updated: March 2, 2026
      </SettingsLegalLastUpdated>

      <SettingsLegalSectionTitle>1. Introduction</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        Welcome to the ConUNav application (&quot;App&quot;) provided by
        Concordia University (&quot;University&quot;, &quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;). By downloading, installing, or
        using this App, you agree to be bound by these Terms of Service
        (&quot;Terms&quot;). If you do not agree to these Terms, please do not
        use the App.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>2. Acceptable Use</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        You agree to use the App only for lawful purposes and in accordance with
        these Terms. You agree not to use the App:
      </SettingsLegalParagraph>
      <SettingsLegalBullet>
        • In any way that violates any applicable federal, provincial, local, or
        international law or regulation.
      </SettingsLegalBullet>
      <SettingsLegalBullet>
        • To transmit, or procure the sending of, any advertising or promotional
        material without our prior written consent.
      </SettingsLegalBullet>
      <SettingsLegalBullet>
        • To impersonate or attempt to impersonate the University, a University
        employee, another user, or any other person or entity.
      </SettingsLegalBullet>

      <SettingsLegalSectionTitle>
        3. Location Services
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        The App uses location services to provide navigation and mapping
        features. By enabling location services, you consent to the collection,
        use, and sharing of your location data as described in our Privacy
        Policy. You may disable location services at any time through your
        device settings, but this may limit the functionality of the App.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>4. User Content</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        The App may allow you to submit feedback, report issues, or provide
        other content. By submitting any content, you grant the University a
        non-exclusive, worldwide, royalty-free license to use, reproduce,
        modify, and distribute such content for the purpose of improving the App
        and University services.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        5. Intellectual Property
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        The App and its entire contents, features, and functionality are owned
        by the University or its licensors and are protected by copyright,
        trademark, and other laws. You may use the App solely for personal,
        non-commercial purposes.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        6. Disclaimer of Warranties
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        The App is provided on an &quot;as is&quot; and &quot;as available&quot;
        basis. The University makes no representations or warranties of any
        kind, express or implied, regarding the operation or availability of the
        App, or the accuracy or reliability of any information provided.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        7. Limitation of Liability
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        To the fullest extent permitted by law, the University shall not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages arising out of or related to your use of, or inability to use,
        the App.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        8. Changes to These Terms
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        We may update these Terms from time to time. When we do, we will revise
        the &quot;Last Updated&quot; date above. Your continued use of the App
        after any changes constitutes your acceptance of the revised Terms.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>9. Contact</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        If you have questions about these Terms, please contact the course staff
        or project maintainers associated with ConUNav.
      </SettingsLegalParagraph>
    </SettingsScreenScaffold>
  );
}
