import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import AppCard from '../components/AppCard';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import TaskAttachmentsSection from '../components/TaskAttachmentsSection';
import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import {
  getApiErrorMessage,
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
  useGetWorkspaceByIdQuery,
  useRemoveTaskAssigneeMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from '../store/api';

type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

// ─── Types ───────────────────────────────────────────────
type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

type Assignee = {
  id: string;
  name: string;
  email: string;
};

const INITIAL_ASSIGNEES: Assignee[] = [];

// ─── Helpers ─────────────────────────────────────────────
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];
const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// ─── Sub-components ──────────────────────────────────────
const InitialsAvatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const color = getAvatarColor(name);
  return (
    <View
      style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color + '55' },
      ]}
    >
      <Text style={[avatarStyles.initials, { color, fontSize: size * 0.36 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  initials: { fontWeight: '700' },
});

// ─── Edit Comment Modal ───────────────────────────────────
type EditModalProps = {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

const EditCommentModal = ({ visible, value, onChange, onSave, onCancel }: EditModalProps) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
    <Pressable style={modalStyles.overlay} onPress={onCancel}>
      <Pressable style={modalStyles.box} onPress={() => {}}>
        <Text style={modalStyles.title}>Edit Comment</Text>
        <TextInput
          style={modalStyles.input}
          value={value}
          onChangeText={onChange}
          multiline
          placeholder="Edit your comment..."
          placeholderTextColor="#94A3B8"
          autoFocus
        />
        <View style={modalStyles.btnRow}>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.saveBtn} onPress={onSave}>
            <Text style={modalStyles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  box: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelText: { color: '#475569', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});

// ─── Main Screen ─────────────────────────────────────────
const DetailsScreen = ({ route, navigation }: DetailsScreenProps) => {
  const { taskId, workspaceId } = route.params;

  // ── Queries — each exposes its own refetch + isFetching ──
  const {
    data: task,
    isLoading: isTaskLoading,
    isFetching: isTaskFetching,
    refetch: refetchTask,
  } = useGetTaskByIdQuery({ workspaceId, taskId });

  const {
    data: workspace,
    isFetching: isWorkspaceFetching,
    refetch: refetchWorkspace,
  } = useGetWorkspaceByIdQuery(
    { workspaceId },
    { skip: !workspaceId },
  );

  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetching: isCommentsFetching,
    refetch: refetchComments,
  } = useGetCommentsQuery(
    { workspaceId, taskId },
    { skip: !workspaceId || !taskId },
  );

  // ── isRefreshing: true when ANY query is re-fetching after initial load
  //    (mirrors HomeScreen's combined loading state pattern) ──
  const isRefreshing =
    (isTaskFetching || isWorkspaceFetching || isCommentsFetching) &&
    !isTaskLoading &&
    !commentsLoading;

  // ── onRefresh: refetch all three queries in parallel (mirrors HomeScreen's
  //    onRefresh calling refetchWorkspaces + loadTasks together) ──
  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchTask(),
      refetchWorkspace(),
      refetchComments(),
    ]);
  }, [refetchTask, refetchWorkspace, refetchComments]);

  // ── Re-fetch whenever the screen comes into focus (mirrors useFocusEffect
  //    in HomeScreen so data stays fresh on back-navigation) ──
  useFocusEffect(
    useCallback(() => {
      refetchTask();
      refetchWorkspace();
      refetchComments();
    }, [refetchTask, refetchWorkspace, refetchComments]),
  );

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [removeTaskAssignee] = useRemoveTaskAssigneeMutation();
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const isOwner = workspace?.role === 'OWNER';

  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState('');
  const [assignees, setAssignees] = useState<Assignee[]>(INITIAL_ASSIGNEES);

  useEffect(() => {
    if (!task) return;
    setAssignees(task.assignees.map((a: any) => ({ id: a.user.id, name: a.user.name, email: a.user.email })));
  }, [task]);

  // ── INITIAL LOADING STATE ──
  if (isTaskLoading || !task) {
    return (
      <Screen>
        <ScreenHeader title="Task Detail" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={{ marginTop: 8, color: '#64748B' }}>Loading task…</Text>
        </View>
      </Screen>
    );
  }

  const formattedDate = task.dueDate ? task.dueDate.split('T')[0] : 'Not set';

  const comments: Comment[] =
    (commentsData ?? []).map((c: any) => ({
      id: c.id,
      author: c.createdBy?.name ?? 'Unknown',
      text: c.content,
      createdAt: c.createdAt,
    }));

  // ── Comment handlers ──
  const handlePostComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    try {
      await createComment({ workspaceId, taskId, content: trimmed }).unwrap();
      setNewComment('');
    } catch (error) {
      Alert.alert('Post failed', getApiErrorMessage(error, 'Could not post comment.'));
    }
  };

  const handleEditOpen = (comment: Comment) => {
    setEditingComment(comment);
    setEditText(comment.text);
  };

  const handleEditSave = async () => {
    if (!editingComment || !editText.trim()) return;
    try {
      await updateComment({
        workspaceId,
        taskId,
        commentId: editingComment.id,
        content: editText.trim(),
      }).unwrap();
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      Alert.alert('Edit failed', getApiErrorMessage(error, 'Could not edit comment.'));
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment({ workspaceId, taskId, commentId }).unwrap();
          } catch (error) {
            Alert.alert('Delete failed', getApiErrorMessage(error, 'Could not delete the comment.'));
          }
        },
      },
    ]);
  };

  // ── Assignee handlers ──
  const handleRemoveAssignee = (assignee: Assignee) => {
    Alert.alert('Remove Assignee', `Remove ${assignee.name} from this task?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTaskAssignee({ workspaceId, taskId, userId: assignee.id }).unwrap();
            setAssignees((prev) => prev.filter((a) => a.id !== assignee.id));
          } catch (error) {
            Alert.alert('Remove failed', getApiErrorMessage(error, 'Could not remove assignee.'));
          }
        },
      },
    ]);
  };

  // ── Task delete ──
  const handleDeleteTask = () => {
    if (!isOwner) {
      Alert.alert('Permission denied', 'Only the workspace owner can delete this task.');
      return;
    }
    Alert.alert('Delete task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask({ workspaceId, taskId }).unwrap();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Delete failed', getApiErrorMessage(error, 'Unable to delete task right now.'));
          }
        },
      },
    ]);
  };


  return (
    <Screen>
      <ScreenHeader title="Task Detail" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#0F766E"
              colors={["#0F766E"]}
            />
          }
        >

          {/* ── TASK CARD ── */}
          <AppCard>
            <View style={styles.titleRow}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <TouchableOpacity
                style={[styles.deleteBtn, !isOwner && styles.deleteBtnDisabled]}
                onPress={handleDeleteTask}
                disabled={isDeleting}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>
              {task.description || 'No description available'}
            </Text>

            <View style={styles.badges}>
              <Badge label={task.priority} type="priority" />
              <Badge label={task.status} type="status" />
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Workspace</Text>
              <Text style={styles.infoValue}>{workspace?.name ?? 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </AppCard>

          {/* ── ASSIGNEES SECTION ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assignees</Text>
            <Text style={styles.sectionCount}>{assignees.length}</Text>
          </View>

          <View style={styles.card}>
            {assignees.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyText}>No assignees on this task</Text>
              </View>
            ) : (
              assignees.map((assignee, index) => (
                <View
                  key={assignee.id}
                  style={[
                    styles.assigneeRow,
                    index < assignees.length - 1 && styles.assigneeRowBorder,
                  ]}
                >
                  <InitialsAvatar name={assignee.name} size={38} />
                  <View style={styles.assigneeInfo}>
                    <Text style={styles.assigneeName}>{assignee.name}</Text>
                    <Text style={styles.assigneeEmail}>{assignee.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveAssignee(assignee)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TaskAttachmentsSection
            workspaceId={workspaceId}
            taskId={taskId}
            title="Attachments"
            showHeader
          />

          {/* ── COMMENTS SECTION ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <Text style={styles.sectionCount}>{comments.length}</Text>
          </View>

          <View style={styles.card}>
            {comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <View
                  key={comment.id}
                  style={[
                    styles.commentItem,
                    index < comments.length - 1 && styles.commentItemBorder,
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <InitialsAvatar name={comment.author} size={32} />
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                    </View>
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleEditOpen(comment)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionIconEdit}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleDeleteComment(comment.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionIconDelete}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.commentInputCard}>
            <InitialsAvatar name="Alice Johnson" size={34} />
            <View style={styles.commentInputWrap}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor="#94A3B8"
                multiline
              />
              <TouchableOpacity
                style={[styles.postBtn, !newComment.trim() && styles.postBtnDisabled]}
                onPress={handlePostComment}
                disabled={!newComment.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <EditCommentModal
        visible={!!editingComment}
        value={editText}
        onChange={setEditText}
        onSave={handleEditSave}
        onCancel={() => { setEditingComment(null); setEditText(''); }}
      />
    </Screen>
  );
};

export default DetailsScreen;

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A', marginRight: 12 },
  deleteBtn: { backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  description: { marginTop: 8, color: '#475569', lineHeight: 20 },
  badges: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  infoLabel: { color: '#64748B', fontWeight: '600' },
  infoValue: { color: '#0F172A', fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  sectionCount: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  emptyState: { paddingVertical: 28, alignItems: 'center', gap: 6 },
  emptyIcon: { fontSize: 26 },
  emptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },

  assigneeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  assigneeRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  assigneeInfo: { flex: 1 },
  assigneeName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  assigneeEmail: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  removeBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  removeBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  uploadPillWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#0F766E',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 13,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnIcon: { fontSize: 16 },
  uploadBtnText: { color: '#0F766E', fontWeight: '700', fontSize: 14 },
  uploadHint: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 6 },

  commentItem: { paddingHorizontal: 14, paddingVertical: 12 },
  commentItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commentMeta: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  commentTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  commentActions: { flexDirection: 'row', gap: 2 },
  actionIconBtn: { padding: 6, borderRadius: 8 },
  actionIconEdit: { fontSize: 14, color: '#2563EB' },
  actionIconDelete: { fontSize: 14, color: '#EF4444' },
  commentText: { color: '#334155', fontSize: 14, lineHeight: 20, marginLeft: 42 },

  commentInputCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
  },
  commentInputWrap: { flex: 1, gap: 8 },
  commentInput: { color: '#0F172A', fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  postBtn: { backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});