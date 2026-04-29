import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Avatar from "../components/Avatar";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import { RootStackParamList } from "../navigation/types";
import {
  getApiErrorMessage,
  useChangeWorkspaceMemberRoleMutation,
  useGetWorkspaceByIdQuery,
  useRemoveWorkspaceMemberMutation,
} from "../store/api";

type WorkspaceDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "WorkspaceDetail"
>;

/* ── Types ── */
type MemberRole = "OWNER" | "MEMBER";

interface MemberItem {
  id: string;
  role: MemberRole;
  user: { id: string; name: string; email?: string };
}

/* ── Accent colors (consistent with TeamsScreen) ── */
const ACCENT_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1", "#EF4444"];

const getAccentColor = (id: string) => {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
};

const hexToTint = (hex: string) => hex + "18";

/* ── Role pill config ── */
const ROLE_CONFIG: Record<
  MemberRole,
  { bg: string; text: string; label: string }
> = {
  OWNER: { bg: "#FEF3C7", text: "#92400E", label: "Owner" },
  MEMBER: { bg: "#ECFDF5", text: "#065F46", label: "Member" },
};

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[(role?.toUpperCase() as MemberRole)] ?? {
    bg: "#F1F5F9",
    text: "#475569",
    label: role ?? "Member",
  };

/* ── Member Action Modal ── */
interface MemberActionModalProps {
  visible: boolean;
  member: MemberItem | null;
  isLoading: boolean;
  onClose: () => void;
  onChangeRole: (member: MemberItem, newRole: MemberRole) => void;
  onRemove: (member: MemberItem) => void;
}

const MemberActionModal = ({
  visible,
  member,
  isLoading,
  onClose,
  onChangeRole,
  onRemove,
}: MemberActionModalProps) => {
  if (!member) return null;

  const isOwner = member.role?.toUpperCase() === "OWNER";
  const toggleRole: MemberRole = isOwner ? "MEMBER" : "OWNER";
  const toggleLabel = isOwner ? "Demote to Member" : "Promote to Owner";
  const toggleIcon = isOwner ? "↓" : "↑";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {/* Member info */}
          <View style={styles.modalMemberRow}>
            <Avatar name={member.user.name} size={44} />
            <View style={styles.modalMemberInfo}>
              <Text style={styles.modalMemberName}>{member.user.name}</Text>
              {member.user.email ? (
                <Text style={styles.modalMemberEmail}>
                  {member.user.email}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.modalRolePill,
                { backgroundColor: getRoleConfig(member.role).bg },
              ]}
            >
              <Text
                style={[
                  styles.modalRolePillText,
                  { color: getRoleConfig(member.role).text },
                ]}
              >
                {getRoleConfig(member.role).label}
              </Text>
            </View>
          </View>

          <View style={styles.modalDivider} />

          {/* Change Role */}
          <TouchableOpacity
            style={[styles.modalAction, isLoading && styles.modalActionDisabled]}
            disabled={isLoading}
            onPress={() => onChangeRole(member, toggleRole)}
          >
            <View style={[styles.modalActionIcon, styles.modalActionIconRole]}>
              <Text style={styles.modalActionIconText}>{toggleIcon}</Text>
            </View>
            <View style={styles.modalActionInfo}>
              <Text style={styles.modalActionTitle}>{toggleLabel}</Text>
              <Text style={styles.modalActionSub}>
                {isOwner
                  ? "Remove owner permissions from this member"
                  : "Grant full owner access to this member"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Remove Member */}
          <TouchableOpacity
            style={[styles.modalAction, isLoading && styles.modalActionDisabled]}
            disabled={isLoading}
            onPress={() => onRemove(member)}
          >
            <View
              style={[styles.modalActionIcon, styles.modalActionIconRemove]}
            >
              <Text style={styles.modalActionIconText}>✕</Text>
            </View>
            <View style={styles.modalActionInfo}>
              <Text style={[styles.modalActionTitle, styles.removeText]}>
                Remove Member
              </Text>
              <Text style={styles.modalActionSub}>
                Remove {member.user.name} from this workspace
              </Text>
            </View>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={[styles.modalCancelBtn, isLoading && styles.modalActionDisabled]}
            disabled={isLoading}
            onPress={onClose}
          >
            <Text style={styles.modalCancelText}>
              {isLoading ? "Please wait…" : "Cancel"}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

/* ── Main Screen ── */
const WorkspaceDetailScreen = ({
  route,
  navigation,
}: WorkspaceDetailScreenProps) => {
  const { workspaceId, workspaceName, workspaceDescription, workspaceRole } =
    route.params;

  const { data, isLoading, isFetching, refetch } = useGetWorkspaceByIdQuery({ workspaceId });

  const [removeWorkspaceMember, { isLoading: isRemoving }] =
    useRemoveWorkspaceMemberMutation();
  const [changeWorkspaceMemberRole, { isLoading: isChangingRole }] =
    useChangeWorkspaceMemberRoleMutation();

  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const name = workspaceName ?? data?.name ?? "Workspace";
  const description = workspaceDescription ?? data?.description ?? "";
  const role = workspaceRole ?? "member";

  const members = (data?.members as MemberItem[] | undefined) ?? [];

  const roleConfig = getRoleConfig(role);
  const accent = getAccentColor(workspaceId);
  const tint = hexToTint(accent);
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  const isMutating = isRemoving || isChangingRole;

  const handleOpenMemberActions = (member: MemberItem) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isMutating) return; // prevent closing mid-request
    setModalVisible(false);
    setSelectedMember(null);
  };

  const handleChangeRole = async (member: MemberItem, newRole: MemberRole) => {
    try {
      await changeWorkspaceMemberRole({
        workspaceId,
        userId: member.user.id,
        role: newRole,
      }).unwrap();
      setModalVisible(false);
      setSelectedMember(null);
    } catch (error) {
      Alert.alert(
        "Role Change Failed",
        getApiErrorMessage(error, "Unable to change member role right now.")
      );
    }
  };

  const handleRemoveMember = (member: MemberItem) => {
    // Close modal first, then confirm
    setModalVisible(false);
    setSelectedMember(null);

    setTimeout(() => {
      Alert.alert(
        "Remove Member",
        `Are you sure you want to remove ${member.user.name} from the workspace?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeWorkspaceMember({
                  workspaceId,
                  userId: member.user.id,
                }).unwrap();
              } catch (error) {
                Alert.alert(
                  "Remove Failed",
                  getApiErrorMessage(
                    error,
                    "Unable to remove member right now."
                  )
                );
              }
            },
          },
        ]
      );
    }, 200);
  };

  return (
    <Screen>
      <ScreenHeader title="Workspace Details" />

      {/* ── HEADER CARD ── */}
      <View style={styles.headerCard}>
        {/* Accent top bar */}
        <View style={[styles.headerTopBar, { backgroundColor: accent }]} />

        <View style={styles.headerBody}>
          {/* Avatar + Name + Description */}
          <View style={styles.headerMain}>
            <View style={[styles.headerAvatar, { backgroundColor: tint }]}>
              <Text style={[styles.headerAvatarText, { color: accent }]}>
                {initial}
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {name}
              </Text>
              <Text
                style={[
                  styles.headerDescription,
                  !description?.trim() && styles.headerDescriptionEmpty,
                ]}
                numberOfLines={2}
              >
                {description?.trim() || "No description available"}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.headerDivider} />

          {/* Stats: role pill + dot + members count */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statRolePill,
                { backgroundColor: roleConfig.bg },
              ]}
            >
              <Text style={[styles.statRoleText, { color: roleConfig.text }]}>
                {roleConfig.label}
              </Text>
            </View>

            <Text style={styles.statDot}>·</Text>

            <Text style={styles.statMembersCount}>
              {isLoading ? "—" : members.length}
            </Text>
            <Text style={styles.statMembersLabel}>
              {members.length === 1 ? "Member" : "Members"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── MEMBERS SECTION ── */}
      <View style={styles.membersTitleRow}>
        <Text style={styles.membersTitle}>Members</Text>
        <TouchableOpacity
          style={styles.addMemberBtn}
          onPress={() => navigation.navigate("InviteMember", { workspaceId })}
        >
          <Text style={styles.addMemberBtnText}>＋  Add Member</Text>
        </TouchableOpacity>
      </View>

      {/* MEMBERS CARD */}
      <View style={styles.membersCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
          }
        >
          {isFetching && !isLoading ? (
            <View style={styles.refreshRow}>
              <Text style={styles.refreshText}>Refreshing workspace data…</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.centeredRow}>
              <Text style={styles.mutedText}>Loading members…</Text>
            </View>
          ) : members.length === 0 ? (
            <View style={styles.centeredRow}>
              <Text style={styles.mutedText}>No members yet.</Text>
            </View>
          ) : (
            members.map((member, index) => {
              const mRoleConfig = getRoleConfig(member.role);
              const isLast = index === members.length - 1;

              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.75}
                  style={[
                    styles.memberCard,
                    isLast && styles.memberCardLast,
                  ]}
                  onPress={() => handleOpenMemberActions(member)}
                >
                  <Avatar name={member.user.name} size={40} />

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.user.name}</Text>
                    {member.user.email ? (
                      <Text style={styles.memberEmail}>
                        {member.user.email}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.memberRight}>
                    <View
                      style={[
                        styles.memberRolePill,
                        { backgroundColor: mRoleConfig.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberRoleText,
                          { color: mRoleConfig.text },
                        ]}
                      >
                        {mRoleConfig.label}
                      </Text>
                    </View>
                    <Text style={styles.memberChevron}>⋯</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── MEMBER ACTION MODAL ── */}
      <MemberActionModal
        visible={modalVisible}
        member={selectedMember}
        isLoading={isMutating}
        onClose={handleCloseModal}
        onChangeRole={handleChangeRole}
        onRemove={handleRemoveMember}
      />
    </Screen>
  );
};

export default WorkspaceDetailScreen;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  /* ── HEADER CARD ── */
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  headerTopBar: {
    height: 4,
    width: "100%",
  },

  headerBody: {
    padding: 14,
    gap: 12,
  },

  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatarText: {
    fontSize: 20,
    fontWeight: "700",
  },

  headerInfo: {
    flex: 1,
    gap: 4,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  headerDescriptionEmpty: {
    fontStyle: "italic",
    color: "#94A3B8",
  },

  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
  },

  /* ── STATS ROW ── */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statRolePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  statRoleText: {
    fontSize: 12,
    fontWeight: "700",
  },

  statDot: {
    fontSize: 16,
    color: "#CBD5E1",
    lineHeight: 18,
  },

  statMembersCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  statMembersLabel: {
    fontSize: 13,
    color: "#64748B",
  },

  /* ── MEMBERS SECTION TITLE ── */
  membersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  membersTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  addMemberBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F766E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },

  addMemberBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  /* ── MEMBERS CARD ── */
  membersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    maxHeight: 320,
  },

  centeredRow: {
    padding: 24,
    alignItems: "center",
  },

  mutedText: {
    color: "#94A3B8",
    fontSize: 14,
  },

  refreshRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
    alignItems: "center",
  },

  refreshText: {
    fontSize: 12,
    color: "#64748B",
  },

  /* ── MEMBER ROW ── */
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },

  memberCardLast: {
    borderBottomWidth: 0,
  },

  memberInfo: {
    flex: 1,
    gap: 2,
  },

  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  memberEmail: {
    fontSize: 12,
    color: "#94A3B8",
  },

  memberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  memberRolePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  memberRoleText: {
    fontSize: 11,
    fontWeight: "700",
  },

  memberChevron: {
    fontSize: 18,
    color: "#CBD5E1",
    lineHeight: 20,
  },

  /* ── MODAL ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 20,
  },

  modalMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  modalMemberInfo: {
    flex: 1,
    gap: 2,
  },

  modalMemberName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  modalMemberEmail: {
    fontSize: 13,
    color: "#94A3B8",
  },

  modalRolePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  modalRolePillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },

  modalAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },

  modalActionDisabled: {
    opacity: 0.45,
  },

  modalActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modalActionIconRole: {
    backgroundColor: "#EFF6FF",
  },

  modalActionIconRemove: {
    backgroundColor: "#FEF2F2",
  },

  modalActionIconText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  modalActionInfo: {
    flex: 1,
    gap: 2,
  },

  modalActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  modalActionSub: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },

  removeText: {
    color: "#EF4444",
  },

  modalCancelBtn: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
});