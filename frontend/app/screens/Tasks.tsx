import { useCallback, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import TaskCard from "../components/TaskCard";
import { RootStackParamList } from "../navigation/types";
import { Task, useGetAllWorkspacesQuery, useLazyGetWorkspaceTasksQuery } from "../store/api";

type TaskWithWorkspaceName = Task & { workspaceName: string };

// ─── Tab config ───────────────────────────────────────────
type Tab = "All" | "To-do" | "In-Progress" | "In-Review" | "Done";

const STATUS_MAP: Record<Exclude<Tab, "All">, Task["status"]> = {
  "To-do": "TODO",
  "In-Progress": "IN_PROGRESS",
  "In-Review": "IN_REVIEW",
  Done: "DONE",
};

const TABS: Tab[] = ["All", "To-do", "In-Progress", "In-Review", "Done"];

// Count badge per tab
const getCount = (tasks: TaskWithWorkspaceName[], tab: Tab): number => {
  if (tab === "All") return tasks.length;
  return tasks.filter(
    (t) => t.status === STATUS_MAP[tab as Exclude<Tab, "All">],
  ).length;
};

// ─── Component ────────────────────────────────────────────
const Tasks = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");

  const [tasks, setTasks] = useState<TaskWithWorkspaceName[]>([]);
  const { data: workspaces = [], isLoading: isWorkspacesLoading, refetch: refetchWorkspaces } = useGetAllWorkspacesQuery(undefined);
  const [fetchWorkspaceTasks, { isFetching: isFetchingTasks }] = useLazyGetWorkspaceTasksQuery();

  const isRefreshing = isFetchingTasks && !isWorkspacesLoading;

  // ✅ FIX: Stable primitive key derived from workspaces array.
  // Using the raw `workspaces` array as a useCallback dependency causes an
  // infinite loop on iOS because RTK Query returns a new array reference on
  // every render. A joined string of IDs only changes when workspaces actually
  // change, keeping loadTasks referentially stable between renders.
  // Note: workspaceIdsKey was already defined here but was not being used in
  // the useCallback dep array — the original code still captured `workspaces`
  // via closure. Now it is the sole dependency for workspace identity.
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
          const res = await fetchWorkspaceTasks({ workspaceId: workspace.id }).unwrap();
          return res.tasks.map((task) => ({ ...task, workspaceName: workspace.name }));
        } catch {
          return [] as TaskWithWorkspaceName[];
        }
      }),
    );

    setTasks(taskGroups.flat());
  }, [fetchWorkspaceTasks, workspaceIdsKey]); // ✅ stable string, not the raw array

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const onRefresh = useCallback(async () => {
    await refetchWorkspaces();
    await loadTasks();
  }, [refetchWorkspaces, loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byTab =
        tab === "All"
          ? true
          : task.status === STATUS_MAP[tab as Exclude<Tab, "All">];
      const byQuery = task.title.toLowerCase().includes(query.toLowerCase());
      return byTab && byQuery;
    });
  }, [tab, query, tasks]);

  return (
    <Screen disableTopInset>
      {/* INITIAL LOADING STATE */}
      {isWorkspacesLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <>
          {/* ── SEARCH + ADD ROW ── */}
          <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#94A3B8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks…"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() => navigation.navigate("CreateTask")}
              accessibilityLabel="Create new task"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ── TABS (horizontal scroll — fixed height so active state never shifts layout) ── */}
          <View style={styles.tabWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              {TABS.map((label) => {
                const count = getCount(tasks, label);
                const active = tab === label;
                return (
                  <Pressable
                    key={label}
                    style={[styles.tabButton, active && styles.tabButtonActive]}
                    onPress={() => setTab(label)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {label}
                    </Text>
                    <View
                      style={[styles.tabBadge, active && styles.tabBadgeActive]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          active && styles.tabBadgeTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── TASK LIST ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#0F766E"
                colors={["#0F766E"]}
              />
            }
          >
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No tasks found</Text>
                <Text style={styles.emptySubtitle}>
                  {query
                    ? `No results for "${query}"`
                    : "Create your first task to get started"}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
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
              ))
            )}
          </ScrollView>
        </>
      )}
    </Screen>
  );
};

export default Tasks;

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  // Search + Add row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: "#0F766E",
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "500",
  },
  clearBtn: { padding: 4 },

  // Tabs
  tabWrapper: {
    height: 48,
    marginBottom: 12,
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
    height: 48,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  tabText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 12,
  },
  tabTextActive: { color: "#FFFFFF" },
  tabBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  tabBadgeTextActive: { color: "#FFFFFF" },

  // Task list
  listContent: { paddingBottom: 24, gap: 0 },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 13,
  },

  // Center loading (full screen)
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  // Empty state
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
});