import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Avatar from "../components/Avatar";
import Screen from "../components/Screen";
import { RootStackParamList } from "../navigation/types";
import {
  getApiErrorMessage,
  useDeleteWorkspaceMutation,
  useGetAllWorkspacesQuery,
} from "../store/api";

const ACCENT_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1", "#EF4444"];

const getAccentColor = (id: string) => {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
};

const hexToTint = (hex: string) => hex + "18";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  owner: { bg: "#FEF3C7", text: "#92400E" },
  admin: { bg: "#EDE9FE", text: "#5B21B6" },
  member: { bg: "#ECFDF5", text: "#065F46" },
};

const getRoleStyle = (role: string) =>
  ROLE_COLORS[role?.toLowerCase()] ?? { bg: "#F1F5F9", text: "#475569" };

const TeamsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: workspaces, isLoading } = useGetAllWorkspacesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [deleteWorkspace] = useDeleteWorkspaceMutation();

  const handleDeleteWorkspace = (id: string, name: string) => {
    Alert.alert(
      "Delete workspace",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkspace({ workspaceId: id }).unwrap();
            } catch (error) {
              Alert.alert(
                "Delete failed",
                getApiErrorMessage(error, "Unable to delete workspace right now.")
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <Screen disableTopInset>
        {/* LOADING */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading workspaces…</Text>
          </View>
        )}

        {/* EMPTY STATE */}
        {!isLoading && (!workspaces || workspaces.length === 0) && (
          <View style={styles.center}>
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🗂</Text>
            </View>
            <Text style={styles.emptyTitle}>No workspaces yet</Text>
            <Text style={styles.emptyBody}>
              Tap the + button to create your first workspace.
            </Text>
          </View>
        )}

        {/* WORKSPACE CARDS */}
        {!isLoading &&
          workspaces?.map((workspace) => {
            const accent = getAccentColor(workspace.id);
            const tint = hexToTint(accent);
            const roleStyle = getRoleStyle(workspace.role);
            const initial = workspace.name?.trim()?.[0]?.toUpperCase() ?? "?";

            return (
              <TouchableOpacity
                key={workspace.id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("WorkspaceDetail", {
                    workspaceId: workspace.id,
                    workspaceName: workspace.name,
                    // workspaceDescription: workspace.description,
                    workspaceRole: workspace.role,
                  })
                }
                style={styles.cardWrap}
              >
                {/* TOP BAR */}
                <View style={[styles.topBar, { backgroundColor: accent }]} />

                <View style={styles.cardBody}>
                  {/* HEADER */}
                  <View style={styles.headerRow}>
                    <View style={[styles.avatar, { backgroundColor: tint }]}>
                      <Text style={[styles.avatarText, { color: accent }]}>
                        {initial}
                      </Text>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.workspaceName} numberOfLines={1}>
                        {workspace.name}
                      </Text>
                      <Text
                        style={[
                          styles.description,
                          !workspace.description?.trim() && styles.descriptionEmpty,
                        ]}
                        numberOfLines={1}
                      >
                        {workspace.description?.trim() || "No description available"}
                      </Text>
                    </View>

                    <View style={[styles.rolePill, { backgroundColor: roleStyle.bg }]}>
                      <Text style={[styles.roleText, { color: roleStyle.text }]}>
                        {workspace.role}
                      </Text>
                    </View>
                  </View>

                  {/* DIVIDER */}
                  <View style={styles.divider} />

                  {/* FOOTER */}
                  <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                      <Avatar name={workspace.name} size={22} />
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() =>
                          navigation.navigate("CreateWorkspace", {
                            workspaceId: workspace.id,
                            name: workspace.name,
                            description: workspace.description,
                          })
                        }
                      >
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() =>
                          handleDeleteWorkspace(workspace.id, workspace.name)
                        }
                      >
                        <Text style={styles.actionBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </Screen>

      {/* FLOATING BUTTON */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => navigation.navigate("CreateWorkspace")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TeamsScreen;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  root: { flex: 1 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  emptyWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyEmoji: { fontSize: 30 },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  emptyBody: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  /* CARD */
  cardWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  topBar: {
    height: 4,
    width: "100%",
  },

  cardBody: {
    padding: 14,
    gap: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "700",
  },

  infoBlock: {
    flex: 1,
  },

  workspaceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  description: {
    fontSize: 12,
    color: "#64748B",
  },

  descriptionEmpty: {
    fontStyle: "italic",
    color: "#94A3B8",
  },

  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  roleText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  editBtn: {
    backgroundColor: "#0EA5E9",
  },

  deleteBtn: {
    backgroundColor: "#EF4444",
  },

  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },

  fabIcon: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
  },
});