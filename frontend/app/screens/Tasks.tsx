import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import TaskCard from '../components/TaskCard';
import { RootStackParamList } from '../navigation/types';
import { Task, useGetAllWorkspacesQuery, useLazyGetWorkspaceTasksQuery } from '../store/api';

type TaskWithWorkspaceName = Task & { workspaceName: string };

const Tasks = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<'All' | 'To-do' | 'In-Progress' | 'Done'>('All');
  const [query, setQuery] = useState('');
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

  const filteredTasks = useMemo(() => {
    const statusMap: Record<'To-do' | 'In-Progress' | 'Done', Task['status']> = {
      'To-do': 'TODO',
      'In-Progress': 'IN_PROGRESS',
      'Done': 'DONE',
    };

    return tasks.filter((task) => {
      const byTab = tab === 'All' ? true : task.status === statusMap[tab];
      const byQuery = task.title.toLowerCase().includes(query.toLowerCase());
      return byTab && byQuery;
    });
  }, [tasks, tab, query]);

  return (
    <Screen disableTopInset>
      {/* SEARCH + PLUS BUTTON */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks"
          placeholderTextColor="#94A3B8"
        />

        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateTask')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {(['All', 'To-do', 'In-Progress', 'Done'] as const).map((label) => (
          <Pressable
            key={label}
            style={[styles.tabButton, tab === label ? styles.tabButtonActive : null]}
            onPress={() => setTab(label)}
          >
            <Text style={[styles.tabText, tab === label ? styles.tabTextActive : null]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* TASK LIST */}
      {(isWorkspacesLoading || isFetchingTasks) && (
        <View style={styles.centeredRow}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      )}

      {filteredTasks.map((task) => (
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

export default Tasks;

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#0F766E',
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  tabButtonActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  tabText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  centeredRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
});