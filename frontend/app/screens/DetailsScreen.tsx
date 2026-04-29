import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppCard from '../components/AppCard';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import {
  getApiErrorMessage,
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
  useGetWorkspaceByIdQuery,
} from '../store/api';

type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Details'
>;

const DetailsScreen = ({ route, navigation }: DetailsScreenProps) => {
  const { taskId, workspaceId } = route.params;

  const { data: task, isLoading, isFetching } =
    useGetTaskByIdQuery({
      workspaceId,
      taskId,
    });

  const { data: workspace } = useGetWorkspaceByIdQuery(
    { workspaceId },
    { skip: !workspaceId },
  );

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const isOwner = workspace?.role === 'OWNER';

  const handleDeleteTask = async () => {
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

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Task Detail" />

        <View style={styles.center}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Loading task…</Text>
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <ScreenHeader title="Task Detail" />

        <View style={styles.center}>
          <Text style={styles.emptyText}>Task not found</Text>
        </View>
      </Screen>
    );
  }

  const assignee = task.assignees[0]?.user ?? task.createdBy;

  // FORMAT DATE
  const formattedDate = task.dueDate
    ? task.dueDate.split('T')[0]
    : 'Not set';

  return (
    <Screen>
      <ScreenHeader title="Task Detail" />

      <AppCard>
        {/* TITLE + DELETE BUTTON */}
        <View style={styles.titleRow}>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <TouchableOpacity
            style={[styles.deleteBtn, !isOwner && styles.deleteBtnDisabled]}
            onPress={handleDeleteTask}
            activeOpacity={0.85}
            disabled={isDeleting}
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

          <Text style={styles.infoValue}>
            {workspace?.name ?? 'Unknown'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Due Date</Text>

          <Text style={styles.infoValue}>
            {formattedDate}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assignee</Text>

          <View style={styles.assigneeRow}>
            <Avatar
              name={assignee?.name ?? 'Unknown'}
              size={24}
            />

            <Text style={styles.infoValue}>
              {assignee?.name ?? 'Unknown'}
            </Text>
          </View>
        </View>
      </AppCard>

      {isFetching ? (
        <Text style={styles.refreshText}>
          Refreshing task…
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() =>
          navigation.navigate('Comments', { taskId })
        }
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          Open Comments
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() =>
          navigation.navigate('FileAttachments', { taskId })
        }
        activeOpacity={0.85}
      >
        <Text style={styles.secondaryBtnText}>
          Open File Attachments
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: '#0F172A',
    fontWeight: '600',
  },

  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },

  /* TITLE ROW */
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  taskTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 12,
  },

  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },

  deleteBtnDisabled: {
    opacity: 0.6,
  },

  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  description: {
    marginTop: 8,
    color: '#475569',
    lineHeight: 20,
  },

  badges: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },

  infoLabel: {
    color: '#64748B',
    fontWeight: '600',
  },

  infoValue: {
    color: '#0F172A',
    fontWeight: '600',
  },

  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  secondaryBtn: {
    borderColor: '#0F766E',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  secondaryBtnText: {
    color: '#0F766E',
    fontWeight: '700',
  },

  refreshText: {
    marginBottom: 10,
    color: '#64748B',
    fontSize: 12,
  },
});

export default DetailsScreen;