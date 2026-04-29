import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import {
  getApiErrorMessage,
  TaskPriority as ApiTaskPriority,
  TaskStatus as ApiTaskStatus,
  useCreateTaskMutation,
  useGetAllWorkspacesQuery,
  useGetWorkspaceByIdQuery,
} from '../store/api';

type Priority = ApiTaskPriority;
type Status = ApiTaskStatus;

type DropdownModalProps = {
  visible: boolean;
  options: Array<{ label: string; value: string }>;
  onSelect: (value: { label: string; value: string }) => void;
  onClose: () => void;
};

const DropdownModal = ({ visible, options, onSelect, onClose }: DropdownModalProps) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.modalBox}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={styles.modalItem}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          >
            <Text style={styles.modalItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

type CalendarModalProps = {
  visible: boolean;
  onSelect: (date: string) => void;
  onClose: () => void;
};

const CalendarModal = ({ visible, onSelect, onClose }: CalendarModalProps) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.calendarBox}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Calendar
            onDayPress={(day: any) => {
              onSelect(day.dateString);
              onClose();
            }}
          />
        </Pressable>
      </View>
    </Pressable>
  </Modal>
);

const STATUS_OPTIONS = [
  { label: 'Todo', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
];

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

const STATUS_LABELS: Record<Status, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const CreateTaskScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<Status>('TODO');

  const [showPriority, setShowPriority] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [dueDate, setDueDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const [workspaceId, setWorkspaceId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);

  const [showError, setShowError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useGetAllWorkspacesQuery(undefined);

  const selectedWorkspaceId = workspaceId || workspaces[0]?.id || '';
  const { data: selectedWorkspace } = useGetWorkspaceByIdQuery(
    { workspaceId: selectedWorkspaceId },
    { skip: !selectedWorkspaceId },
  );

  const workspaceOptions = workspaces.map((item) => ({
    label: item.name,
    value: item.id,
  }));
  const memberOptions = (selectedWorkspace?.members ?? []).map((member) => ({
    label: member.user.name,
    value: member.user.id,
  }));

  useEffect(() => {
    if (!workspaceId && workspaces[0]?.id) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaceId, workspaces]);

  useEffect(() => {
    if (selectedWorkspace?.members?.length && !assigneeId) {
      setAssigneeId(selectedWorkspace.members[0].user.id);
    }
  }, [assigneeId, selectedWorkspace]);

  const selectedWorkspaceName = useMemo(() => {
    return (
      workspaceOptions.find((item) => item.value === selectedWorkspaceId)?.label ??
      'Select Workspace'
    );
  }, [workspaceOptions, selectedWorkspaceId]);

  const selectedAssigneeName = useMemo(() => {
    return (
      memberOptions.find((item) => item.value === assigneeId)?.label ??
      'Assign To'
    );
  }, [assigneeId, memberOptions]);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setShowError('Task title is required.');
      return;
    }

    if (!selectedWorkspaceId) {
      setShowError('Please select a workspace.');
      return;
    }

    try {
      setShowError('');

      const payload = {
        workspaceId: selectedWorkspaceId,
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        status,
        priority,
        ...(dueDate
          ? { dueDate: new Date(`${dueDate}T00:00:00.000Z`).toISOString() }
          : {}),
        ...(assigneeId ? { assigneeIds: [assigneeId] } : {}),
      };

      await createTask(payload).unwrap();

      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setAssigneeId(selectedWorkspace?.members?.[0]?.user.id ?? '');
      setSuccessMessage('Task created successfully.');
    } catch (error) {
      setSuccessMessage('');
      setShowError(getApiErrorMessage(error, 'Unable to create task right now.'));
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Create Task" />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* TITLE */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor="#94A3B8"
        />

        {/* DESCRIPTION */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Task description"
          multiline
          placeholderTextColor="#94A3B8"
        />

        {/* STATUS + PRIORITY */}
        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.label}>Status</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowStatus(true)}>
              <Text style={styles.dropdownText}>{STATUS_LABELS[status]}</Text>
            </Pressable>
          </View>

          <View style={styles.flexItem}>
            <Text style={styles.label}>Priority</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowPriority(true)}>
              <Text style={styles.dropdownText}>{PRIORITY_LABELS[priority]}</Text>
            </Pressable>
          </View>
        </View>

        {/* DUE DATE */}
        <Text style={styles.label}>Due Date</Text>
        <Pressable style={styles.fullDropdown} onPress={() => setShowCalendar(true)}>
          <Text style={styles.dropdownText}>{dueDate ? dueDate : 'Select Date'}</Text>
        </Pressable>

        {/* WORKSPACE */}
        <Text style={styles.label}>Workspace</Text>
        <Pressable style={styles.fullDropdown} onPress={() => setShowWorkspace(true)}>
          <Text style={styles.dropdownText}>
            {isWorkspacesLoading ? 'Loading workspaces...' : selectedWorkspaceName}
          </Text>
        </Pressable>

        {/* ASSIGN TO */}
        <Text style={styles.label}>Assign To</Text>
        <Pressable style={styles.fullDropdown} onPress={() => setShowAssignee(true)}>
          <Text style={styles.dropdownText}>
            {selectedWorkspaceId && memberOptions.length === 0
              ? 'No members available'
              : selectedAssigneeName}
          </Text>
        </Pressable>

        {/* SAVE */}
        <Pressable
          style={[styles.primaryBtn, isCreating && styles.primaryBtnDisabled]}
          onPress={handleCreateTask}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Task</Text>
          )}
        </Pressable>

        {showError ? <Text style={styles.errorMessage}>{showError}</Text> : null}
        {successMessage ? <Text style={styles.message}>{successMessage}</Text> : null}

      </ScrollView>

      {/* ALL MODALS — rendered outside ScrollView so they float over everything */}

      <DropdownModal
        visible={showStatus}
        options={STATUS_OPTIONS}
        onSelect={(val) => setStatus(val.value as Status)}
        onClose={() => setShowStatus(false)}
      />

      <DropdownModal
        visible={showPriority}
        options={PRIORITY_OPTIONS}
        onSelect={(val) => setPriority(val.value as Priority)}
        onClose={() => setShowPriority(false)}
      />

      <DropdownModal
        visible={showWorkspace}
        options={workspaceOptions}
        onSelect={(selectedItem) => {
          setWorkspaceId(selectedItem.value);
          setAssigneeId('');
        }}
        onClose={() => setShowWorkspace(false)}
      />

      <DropdownModal
        visible={showAssignee}
        options={memberOptions}
        onSelect={(selectedItem) => {
          setAssigneeId(selectedItem.value);
        }}
        onClose={() => setShowAssignee(false)}
      />

      <CalendarModal
        visible={showCalendar}
        onSelect={setDueDate}
        onClose={() => setShowCalendar(false)}
      />

    </Screen>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#0F172A',
  },

  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  flexItem: {
    flex: 1,
  },

  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },

  fullDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  dropdownText: {
    color: '#0F172A',
    fontWeight: '600',
  },

  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  primaryBtnDisabled: {
    opacity: 0.7,
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  message: {
    marginTop: 10,
    color: '#0F766E',
    fontWeight: '600',
    textAlign: 'center',
  },

  errorMessage: {
    marginTop: 10,
    color: '#B91C1C',
    fontWeight: '600',
    textAlign: 'center',
  },

  label: {
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },

  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  modalItemText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
  },

  calendarBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
});