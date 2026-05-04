import { useEffect, useMemo, useRef, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import ScreenHeader from "../components/ScreenHeader";
import Screen from "../components/Screen";
import { RootStackParamList } from "../navigation/types";
import {
  getApiErrorMessage,
  useCreateTaskMutation,
  useGetAllWorkspacesQuery,
  useGetWorkspaceByIdQuery,
} from "../store/api";

// ─── Types ───────────────────────────────────────────────
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Status = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

// ─── Options (all values from spec) ─────────────────────
const STATUS_OPTIONS: {
  label: string;
  value: Status;
  color: string;
  icon: string;
}[] = [
  { label: "To Do", value: "TODO", color: "#94A3B8", icon: "○" },
  { label: "In Progress", value: "IN_PROGRESS", color: "#0EA5E9", icon: "◑" },
  { label: "In Review", value: "IN_REVIEW", color: "#F59E0B", icon: "◕" },
  { label: "Done", value: "DONE", color: "#10B981", icon: "●" },
];

const PRIORITY_OPTIONS: {
  label: string;
  value: Priority;
  color: string;
  icon: string;
}[] = [
  { label: "Low", value: "LOW", color: "#10B981", icon: "↓" },
  { label: "Medium", value: "MEDIUM", color: "#F59E0B", icon: "→" },
  { label: "High", value: "HIGH", color: "#EF4444", icon: "↑" },
  { label: "Urgent", value: "URGENT", color: "#7C3AED", icon: "⚡" },
];

// ─── Helper lookups ──────────────────────────────────────
const findStatus = (v: Status) => STATUS_OPTIONS.find((o) => o.value === v)!;
const findPriority = (v: Priority) =>
  PRIORITY_OPTIONS.find((o) => o.value === v)!;

// ─── Generic Dropdown Modal ──────────────────────────────
type Option = { label: string; value: string; color?: string; icon?: string };

type DropdownModalProps = {
  visible: boolean;
  title: string;
  options: Option[];
  selectedValue: string;
  onSelect: (opt: Option) => void;
  onClose: () => void;
};

const DropdownModal = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: DropdownModalProps) => (
  <Modal
    transparent
    animationType="fade"
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable style={modal.overlay} onPress={onClose}>
      <Pressable style={modal.box} onPress={() => {}}>
        <Text style={modal.title}>{title}</Text>
        {options.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                modal.item,
                index < options.length - 1 && modal.itemBorder,
                isSelected && modal.itemSelected,
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              activeOpacity={0.75}
            >
              <View style={modal.itemLeft}>
                {item.icon && (
                  <Text
                    style={[
                      modal.itemIcon,
                      item.color ? { color: item.color } : null,
                    ]}
                  >
                    {item.icon}
                  </Text>
                )}
                <Text
                  style={[modal.itemText, isSelected && modal.itemTextSelected]}
                >
                  {item.label}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={17} color="#0F766E" />
              )}
            </TouchableOpacity>
          );
        })}
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Calendar Modal ──────────────────────────────────────
type CalendarModalProps = {
  visible: boolean;
  selected: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

const CalendarModal = ({
  visible,
  selected,
  onSelect,
  onClose,
}: CalendarModalProps) => (
  <Modal
    transparent
    animationType="fade"
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable style={modal.overlay} onPress={onClose}>
      <Pressable style={modal.calBox} onPress={() => {}}>
        <Text style={modal.title}>Pick a Due Date</Text>
        <Calendar
          current={selected || undefined}
          markedDates={
            selected
              ? { [selected]: { selected: true, selectedColor: "#0F766E" } }
              : {}
          }
          onDayPress={(day: any) => {
            onSelect(day.dateString);
            onClose();
          }}
          theme={{
            arrowColor: "#0F766E",
            todayTextColor: "#0F766E",
            selectedDayBackgroundColor: "#0F766E",
            textSectionTitleColor: "#475569",
            dayTextColor: "#0F172A",
            textDisabledColor: "#CBD5E1",
          }}
        />
        {selected && (
          <TouchableOpacity
            style={modal.clearDate}
            onPress={() => {
              onSelect("");
              onClose();
            }}
          >
            <Text style={modal.clearDateText}>Clear date</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Field Row (label + pressable trigger) ───────────────
type FieldTriggerProps = {
  label: string;
  value: string;
  iconColor?: string;
  iconChar?: string;
  placeholder?: string;
  onPress: () => void;
};

const FieldTrigger = ({
  label,
  value,
  iconColor,
  iconChar,
  placeholder,
  onPress,
}: FieldTriggerProps) => (
  <View style={field.wrap}>
    <Text style={field.label}>{label}</Text>
    <Pressable style={field.trigger} onPress={onPress}>
      <View style={field.left}>
        {iconChar && (
          <Text style={[field.icon, iconColor ? { color: iconColor } : null]}>
            {iconChar}
          </Text>
        )}
        <Text style={[field.value, !value && field.placeholder]}>
          {value || placeholder || `Select ${label}`}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={14} color="#94A3B8" />
    </Pressable>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────
const CreateTaskScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [status, setStatus] = useState<Status>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [showStatus, setShowStatus] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);

  const [createTask] = useCreateTaskMutation();

  const { data: workspaces = [] } = useGetAllWorkspacesQuery(undefined);
  const firstWorkspaceId = workspaces[0]?.id ?? "";
  const selectedWorkspaceId = workspaceId || firstWorkspaceId;

  const { data: selectedWorkspace } = useGetWorkspaceByIdQuery(
    { workspaceId: selectedWorkspaceId },
    { skip: !selectedWorkspaceId },
  );

  // ✅ FIX: Removed workspaceInitRef entirely.
  // The original ref-guard caused issues when RTK Query invalidated and
  // re-fetched workspaces after task creation — the ref blocked re-init but
  // left state stale. Using a functional state updater `(prev) => prev || next`
  // achieves the same "set once" intent safely: it is a no-op when a workspace
  // is already selected, and picks the first workspace only when state is empty.
  // This is safe to run on every render cycle because the setter is idempotent.
  useEffect(() => {
    if (!firstWorkspaceId) return;
    setWorkspaceId((prev) => prev || firstWorkspaceId);
  }, [firstWorkspaceId]);

  // ✅ FIX: Memoize firstMemberId so its reference is stable across renders.
  // Previously, `selectedWorkspace?.members?.[0]?.user.id` was re-derived
  // inline on every render. On iOS, RTK Query returns new object references
  // more aggressively during cache hydration, so the derived string was seen
  // as "changed" on every cycle, causing the useEffect below to fire repeatedly
  // → setAssigneeId → re-render → repeat (infinite loop). Wrapping in useMemo
  // ensures the value only updates when the members array actually changes.
  const firstMemberId = useMemo(
    () => selectedWorkspace?.members?.[0]?.user.id ?? "",
    [selectedWorkspace?.members],
  );

  const assigneeInitRef = useRef<string>("");

  useEffect(() => {
    if (!firstMemberId) return;
    if (assigneeInitRef.current === selectedWorkspaceId) return;
    assigneeInitRef.current = selectedWorkspaceId;
    setAssigneeId(firstMemberId);
  }, [firstMemberId, selectedWorkspaceId]);

  const workspaceOptions = useMemo(
    () => workspaces.map((w) => ({ label: w.name, value: w.id })),
    [workspaces],
  );

  const assigneeOptions = useMemo(
    () =>
      (selectedWorkspace?.members ?? []).map((member) => ({
        label: member.user.name,
        value: member.user.id,
      })),
    [selectedWorkspace?.members],
  );

  const statusObj = findStatus(status);
  const priorityObj = findPriority(priority);

  const workspaceName =
    workspaceOptions.find((w) => w.value === selectedWorkspaceId)?.label ?? "";
  const assigneeName =
    assigneeOptions.find((a) => a.value === assigneeId)?.label ?? "";

  const isValid = title.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid) return;

    try {
      await createTask({
        workspaceId: selectedWorkspaceId,
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        status,
        priority,
        ...(dueDate
          ? { dueDate: new Date(`${dueDate}T00:00:00.000Z`).toISOString() }
          : {}),
        ...(assigneeId ? { assigneeIds: [assigneeId] } : {}),
      }).unwrap();

      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setAssigneeId(firstMemberId || "");
      navigation.goBack();
    } catch (error) {
      alert(getApiErrorMessage(error, "Unable to create task right now."));
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Create Task" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* ── Title ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, !title && styles.inputEmpty]}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor="#94A3B8"
            returnKeyType="next"
            maxLength={200}
          />
        </View>

        {/* ── Description ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add more context, details, or acceptance criteria…"
            multiline
            textAlignVertical="top"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* ── Status + Priority (side by side) ── */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Status</Text>
            <Pressable
              style={styles.trigger}
              onPress={() => setShowStatus(true)}
            >
              <Text style={[styles.triggerIcon, { color: statusObj.color }]}>
                {statusObj.icon}
              </Text>
              <Text style={styles.triggerText}>{statusObj.label}</Text>
              <Ionicons name="chevron-down" size={13} color="#94A3B8" />
            </Pressable>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Priority</Text>
            <Pressable
              style={styles.trigger}
              onPress={() => setShowPriority(true)}
            >
              <Text style={[styles.triggerIcon, { color: priorityObj.color }]}>
                {priorityObj.icon}
              </Text>
              <Text style={styles.triggerText}>{priorityObj.label}</Text>
              <Ionicons name="chevron-down" size={13} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* ── Due Date ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Due Date</Text>
          <Pressable
            style={[styles.trigger, styles.triggerFull]}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons
              name={dueDate ? "calendar" : "calendar-outline"}
              size={15}
              color={dueDate ? "#0F766E" : "#94A3B8"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.triggerText,
                !dueDate && styles.triggerPlaceholder,
              ]}
            >
              {dueDate || "Select a due date"}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#94A3B8" />
          </Pressable>
        </View>

        {/* ── Workspace ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Workspace</Text>
          <Pressable
            style={[styles.trigger, styles.triggerFull]}
            onPress={() => setShowWorkspace(true)}
          >
            <Ionicons
              name="business-outline"
              size={15}
              color="#475569"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.triggerText}>{workspaceName}</Text>
            <Ionicons name="chevron-down" size={13} color="#94A3B8" />
          </Pressable>
        </View>

        {/* ── Assign To ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Assign To</Text>
          <Pressable
            style={[styles.trigger, styles.triggerFull]}
            onPress={() => setShowAssignee(true)}
          >
            <Ionicons
              name="person-outline"
              size={15}
              color="#475569"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.triggerText}>{assigneeName}</Text>
            <Ionicons name="chevron-down" size={13} color="#94A3B8" />
          </Pressable>
        </View>

        {/* ── Submit ── */}
        <Pressable
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={!isValid}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>Create Task</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Modals ── */}
      <DropdownModal
        visible={showStatus}
        title="Select Status"
        options={STATUS_OPTIONS}
        selectedValue={status}
        onSelect={(opt) => setStatus(opt.value as Status)}
        onClose={() => setShowStatus(false)}
      />
      <DropdownModal
        visible={showPriority}
        title="Select Priority"
        options={PRIORITY_OPTIONS}
        selectedValue={priority}
        onSelect={(opt) => setPriority(opt.value as Priority)}
        onClose={() => setShowPriority(false)}
      />
      <DropdownModal
        visible={showWorkspace}
        title="Select Workspace"
        options={workspaceOptions}
        selectedValue={selectedWorkspaceId}
        onSelect={(opt) => {
          setWorkspaceId(opt.value);
          assigneeInitRef.current = "";
          setAssigneeId("");
        }}
        onClose={() => setShowWorkspace(false)}
      />
      <DropdownModal
        visible={showAssignee}
        title="Assign To"
        options={assigneeOptions}
        selectedValue={assigneeId}
        onSelect={(opt) => setAssigneeId(opt.value)}
        onClose={() => setShowAssignee(false)}
      />
      <CalendarModal
        visible={showCalendar}
        selected={dueDate}
        onSelect={setDueDate}
        onClose={() => setShowCalendar(false)}
      />
    </Screen>
  );
};

export default CreateTaskScreen;

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingBottom: 16 },

  fieldWrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  required: { color: "#EF4444" },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "500",
  },
  inputEmpty: { borderColor: "#E2E8F0" },
  textarea: {
    minHeight: 100,
    lineHeight: 20,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  halfField: { flex: 1 },

  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 6,
  },
  triggerFull: { width: "100%" },
  triggerIcon: {
    fontSize: 14,
    fontWeight: "700",
    width: 18,
    textAlign: "center",
  },
  triggerText: { flex: 1, color: "#0F172A", fontWeight: "600", fontSize: 13 },
  triggerPlaceholder: { color: "#94A3B8", fontWeight: "500" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F766E",
    borderRadius: 13,
    paddingVertical: 15,
    marginTop: 8,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

// ─── Modal styles ─────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 4,
  },
  calBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  itemSelected: { backgroundColor: "#F0FDF4" },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemIcon: { fontSize: 16, width: 20, textAlign: "center", fontWeight: "700" },
  itemText: { fontSize: 14, color: "#334155", fontWeight: "500" },
  itemTextSelected: { color: "#0F766E", fontWeight: "700" },
  clearDate: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  clearDateText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },
});

// ─── FieldTrigger styles ──────────────────────────────────
const field = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 6,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { fontSize: 14, fontWeight: "700", width: 18, textAlign: "center" },
  value: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  placeholder: { color: "#94A3B8", fontWeight: "500" },
});