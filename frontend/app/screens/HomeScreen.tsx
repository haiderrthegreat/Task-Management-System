import { useCallback, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import AppCard from '../components/AppCard';
import Screen from '../components/Screen';
import TaskCard from '../components/TaskCard';
import { RootStackParamList } from '../navigation/types';
import { Task, useGetAllWorkspacesQuery, useLazyGetWorkspaceTasksQuery } from '../store/api';

type TaskWithWorkspaceName = Task & { workspaceName: string };

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tasks, setTasks] = useState<TaskWithWorkspaceName[]>([]);

  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useGetAllWorkspacesQuery(undefined);
  const [fetchWorkspaceTasks, { isFetching: isFetchingTasks }] = useLazyGetWorkspaceTasksQuery();

  const loadTasks = useCallback(async () => {
    if (!workspaces.length) {
      setTasks([]);
      return;
    }

    const results = await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const response = await fetchWorkspaceTasks({ workspaceId: workspace.id }).unwrap();
          return response.tasks.map((task) => ({
            ...task,
            workspaceName: workspace.name,
          }));
        } catch {
          return [] as TaskWithWorkspaceName[];
        }
      }),
    );

    setTasks(results.flat());
  }, [fetchWorkspaceTasks, workspaces]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    [tasks],
  );

  return (
    <Screen disableTopInset>
      <Text style={styles.subtitle}>Overview of your tasks for today.</Text>

      {/* STATS */}
      <View style={styles.statsRow}>
        <AppCard>
          <View style={styles.cardContent}>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.cardContent}>
            <Text style={styles.statValue}>{workspaces.length}</Text>
            <Text style={styles.statLabel}>Workspaces</Text>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.cardContent}>
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </AppCard>
      </View>

      {/* TASKS */}
      <Text style={styles.sectionTitle}>Today's Tasks</Text>

      {(isWorkspacesLoading || isFetchingTasks) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      )}

      {tasks.slice(0, 3).map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          workspaceName={task.workspaceName}
          onPress={() =>
            navigation.navigate('Details', {
              taskId: task.id,
              workspaceId: task.workspaceId,
            })
          }
        />
      ))}
    </Screen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  subtitle: {
    color: '#64748B',
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  statLabel: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
});