import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';

const PrivacyPolicyScreen = () => {
  

  return (
    <Screen>
      <ScreenHeader title="Privacy Policy" />
      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.body}>
          This Privacy Policy describes how Taskflow ("we", "us", or "our") collects, uses,
          and shares information when you use our mobile application and related services
          (the "Service"). By using the Service you agree to the collection and use of
          information in accordance with this policy.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly (account registration, profile data),
          content you create or upload such as tasks, comments, attachments, and workspace
          details, and usage information (logs, device information, IP address) that helps
          us operate and improve the Service.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use collected data to authenticate and manage your account, synchronize tasks
          and workspaces across devices, deliver notifications and reminders, provide
          collaboration features, and improve the Service. Aggregated or anonymized data
          may be used for analytics and performance monitoring.
        </Text>

        <Text style={styles.sectionTitle}>Attachments & File Storage</Text>
        <Text style={styles.body}>
          Files uploaded to tasks or comments (images, documents) are stored securely and
          associated with the corresponding workspace and task. We retain attachments
          as long as required to provide the Service or as described when you upload them.
        </Text>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.body}>
          We send push notifications and in-app alerts for task assignments, due dates,
          workspace invitations, and other activity. You can control notification
          preferences within the app.
        </Text>

        <Text style={styles.sectionTitle}>Sharing & Third Parties</Text>
        <Text style={styles.body}>
          We do not sell your personal information. We may share data with service
          providers who perform services on our behalf (hosting, analytics, email delivery)
          and with other users when you share content within a workspace. Where required,
          we enforce contracts that limit how these providers use your information.
        </Text>

        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.body}>
          We implement reasonable administrative, technical, and physical safeguards
          designed to protect your data. However, no online system is completely secure
          and we cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>Your Choices & Rights</Text>
        <Text style={styles.body}>
          You can access, update, or delete your account information from within the
          app. You may also request copies of the personal data we hold about you by
          contacting us. We will respond to reasonable data access and deletion requests
          as required by applicable law.
        </Text>

        <Text style={styles.sectionTitle}>Children</Text>
        <Text style={styles.body}>
          The Service is not directed to children under 13. We do not knowingly collect
          personal information from children under 13. If you believe we have collected
          data from a child, contact us and we will take steps to remove it.
        </Text>

        <Text style={styles.sectionTitle}>Changes to this Policy</Text>
        <Text style={styles.body}>
          We may update this policy from time to time. We will post the updated policy
          within the app and indicate the effective date. Continued use of the Service
          after changes constitutes acceptance of the revised policy.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          If you have questions or requests about this Privacy Policy, contact Taskflow
          support at support@taskflow.example (replace with your real support address).
        </Text>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    paddingRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 12,
  },
});

export default PrivacyPolicyScreen;