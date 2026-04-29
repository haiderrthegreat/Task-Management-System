import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../store/api';
import AppCard from './AppCard';
import Avatar from './Avatar';
import Badge from './Badge';

type TaskCardProps = {
  task: Task;
  workspaceName?: string;
  onPress: () => void;
};

const TaskCard = ({ task, workspaceName, onPress }: TaskCardProps) => {
  const displayWorkspaceName = workspaceName ?? 'Unknown';

  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{task.title}</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </View>

        <Text style={styles.description}>{task.description}</Text>

        <View style={styles.badgeRow}>
          <Badge label={task.priority} type="priority" />
          <Badge label={task.status} type="status" />
        </View>

        <View style={styles.footer}>
          <View style={styles.assigneeRow}>
            <Avatar name={displayWorkspaceName} size={28} />
            <Text style={styles.assigneeName}>{`Workspace: ${displayWorkspaceName}`}</Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  description: {
    marginTop: 6,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assigneeName: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default TaskCard;
