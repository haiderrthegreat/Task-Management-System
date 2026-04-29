import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import { RootStackParamList } from "../navigation/types";
import {
  getApiErrorMessage,
  useInviteWorkspaceMemberMutation,
} from "../store/api";

type InviteMemberScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "InviteMember"
>;

const InviteMemberScreen = ({ navigation, route }: InviteMemberScreenProps) => {
  const { workspaceId } = route.params;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "OWNER">("MEMBER");
  const [open, setOpen] = useState(false);

  const [inviteWorkspaceMember, { isLoading }] =
    useInviteWorkspaceMemberMutation();

  const handleInvite = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert("Missing Email", "Please enter an email address.");
      return;
    }

    try {
      await inviteWorkspaceMember({
        workspaceId,
        email: trimmedEmail,
      }).unwrap();

      Alert.alert(
        "Invitation Sent",
        `An invitation has been sent to ${trimmedEmail}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );

      setEmail("");
    } catch (error) {
      Alert.alert(
        "Invite Failed",
        getApiErrorMessage(error, "Unable to send invitation right now.")
      );
    }
  };

  const selectRole = (value: "MEMBER" | "OWNER") => {
    setRole(value);
    setOpen(false);
  };

  return (
    <Screen>
      <ScreenHeader title="Invite Member" />

      <View style={styles.container}>
        {/* Email Input */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          placeholder="Enter email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#94A3B8"
          editable={!isLoading}
        />

        {/* Role Dropdown */}
        <View style={styles.field}>
          <Text style={styles.label}>Select Role</Text>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => !isLoading && setOpen(!open)}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownButtonText}>
              {role === "OWNER" ? "Owner" : "Member"}
            </Text>
            <Text style={styles.dropdownChevron}>{open ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {open && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => selectRole("MEMBER")}
              >
                <Text
                  style={role === "MEMBER" ? styles.optionSelected : styles.optionText}
                >
                  Member
                </Text>
                {role === "MEMBER" && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, styles.optionLast]}
                onPress={() => selectRole("OWNER")}
              >
                <Text
                  style={role === "OWNER" ? styles.optionSelected : styles.optionText}
                >
                  Owner
                </Text>
                {role === "OWNER" && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleInvite}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Sending…" : "Send Invitation"}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 13,
    color: "#475569",
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    color: "#0F172A",
    fontSize: 14,
    backgroundColor: "#fff",
  },

  field: {
    marginBottom: 28,
  },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  dropdownButtonText: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 14,
  },

  dropdownChevron: {
    fontSize: 10,
    color: "#94A3B8",
  },

  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },

  optionLast: {
    borderBottomWidth: 0,
  },

  optionText: {
    fontSize: 14,
    color: "#0F172A",
  },

  optionSelected: {
    fontSize: 14,
    color: "#0F766E",
    fontWeight: "700",
  },

  checkmark: {
    fontSize: 14,
    color: "#0F766E",
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#0F766E",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default InviteMemberScreen;