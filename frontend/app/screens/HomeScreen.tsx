import { useCallback, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Screen from "../components/Screen";
import TaskCard from "../components/TaskCard";
import { RootStackParamList } from "../navigation/types";
import {
  Task,
  useGetAllWorkspacesQuery,
  useLazyGetWorkspaceTasksQuery,
} from "../store/api";

type TaskWithWorkspaceName = Task & { workspaceName: string };

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tasks, setTasks] = useState<TaskWithWorkspaceName[]>([]);

  const {
    data: workspaces = [],
    isLoading: isWorkspacesLoading,
    refetch: refetchWorkspaces,
  } = useGetAllWorkspacesQuery(undefined);

  const [fetchWorkspaceTasks, { isFetching: isFetchingTasks }] =
    useLazyGetWorkspaceTasksQuery();

  const isRefreshing = isWorkspacesLoading || isFetchingTasks;

  const workspaceIdsKey = useMemo(
    () => workspaces.map((w) => w.id).join(","),
    [workspaces],
  );

  const loadTasks = useCallback(async () => {
    if (!workspaces.length) {
      setTasks([]);
      return;
    }

    const taskGroups = await Promise.all(
      workspaces.map(async (workspace) => {
        try {
          const response = await fetchWorkspaceTasks({
            workspaceId: workspace.id,
          }).unwrap();

          return response.tasks.map((task) => ({
            ...task,
            workspaceName: workspace.name,
          }));
        } catch {
          return [];
        }
      }),
    );

    setTasks(taskGroups.flat());
  }, [fetchWorkspaceTasks, workspaceIdsKey]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const onRefresh = useCallback(async () => {
    await refetchWorkspaces();
    await loadTasks();
  }, [refetchWorkspaces, loadTasks]);

  const inProgressCount = tasks.filter(
    (t) => t.status === "IN_PROGRESS",
  ).length;

  return (
    <Screen disableTopInset>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#0F766E"
            colors={["#0F766E"]}
          />
        }
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.subtitle}>Here's your overview for today</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>AW</Text>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: PRIMARY }]}>
              {tasks.length}
            </Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{workspaces.length}</Text>
            <Text style={styles.statLabel}>Workspaces</Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                { color: inProgressCount > 0 ? PRIMARY : TEXT_LIGHT },
              ]}
            >
              {inProgressCount}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* ── SECTION HEADING ── */}
        <Text style={styles.sectionTitle}>Today's Tasks</Text>

        {/* ── LOADING STATE ── */}
        {/* {(isWorkspacesLoading || isFetchingTasks) && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={PRIMARY} size="small" />
            <Text style={styles.loadingText}>Loading tasks…</Text>
          </View>
        )} */}

        {/* ── EMPTY STATE ── */}
        {!isWorkspacesLoading && !isFetchingTasks && tasks.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyEmoji}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a task to get started
            </Text>
          </View>
        )}

        {/* ── TASK CARDS ── */}
        {tasks.slice(0, 3).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            workspaceName={task.workspaceName}
            onPress={() =>
              navigation.navigate("Details", {
                taskId: task.id,
                workspaceId: task.workspaceId,
              })
            }
          />
        ))}
      </ScrollView>
    </Screen>
  );
};

export default HomeScreen;

/* ─────────────────────── DESIGN TOKENS ─────────────────────── */

const PRIMARY = "#0F766E";
const PRIMARY_LIGHT = "#E6F4F3";
const TEXT_DARK = "#111827";
const TEXT_MID = "#6B7280";
const TEXT_LIGHT = "#9CA3AF";

/* ─────────────────────── STYLES ─────────────────────── */

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  container: {
    // paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: TEXT_DARK,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MID,
    marginTop: 4,
    lineHeight: 20,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT_DARK,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: TEXT_MID,
    marginTop: 4,
    textAlign: "center",
  },

  /* ── Section heading ── */
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_MID,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: -4,
  },

  /* ── Loading ── */
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: TEXT_MID,
  },

  /* ── Empty state ── */
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MID,
    textAlign: "center",
    lineHeight: 21,
  },
});
