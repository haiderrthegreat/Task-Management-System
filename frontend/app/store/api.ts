import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

// ─────────────────────────────────────────────
// BASE URL
// ─────────────────────────────────────────────

const BASE_URL = "http://172.16.29.39:3000/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// ── Auth ──
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignUpInput = LoginInput & {
  name: string;
};

export type LogoutInput = {
  refreshToken: string;
};

// ── Workspace ──
export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
  updatedAt: string;
  joinedAt: string;
};

export type WorkspaceMember = {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
};

export type WorkspaceDetail = Omit<Workspace, "joinedAt"> & {
  members: WorkspaceMember[];
};

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
};

export type UpdateWorkspaceInput = {
  workspaceId: string;
  name?: string;
  description?: string;
};

export type InviteMemberInput = {
  workspaceId: string;
  email: string;
};

export type RemoveMemberInput = {
  workspaceId: string;
  userId: string;
};

export type ChangeMemberRoleInput = {
  workspaceId: string;
  userId: string;
  role: "OWNER" | "MEMBER";
};

// ── Shared ──
export type BasicSuccessResponse = { success: boolean; message: string };
export type AuthResponse = ApiResponse<AuthPayload>;
export type SignUpResponse = ApiResponse<AuthPayload>;
export type WorkspacesResponse = ApiResponse<Workspace[]>;
export type CreateWorkspaceResponse = ApiResponse<Workspace>;
export type UpdateWorkspaceResponse = ApiResponse<Workspace>;
export type WorkspaceDetailResponse = ApiResponse<WorkspaceDetail>;

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskUser = {
  id: string;
  name: string;
  email: string;
};

export type TaskAssignee = {
  id: string;
  taskId: string;
  userId: string;
  user: TaskUser;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  workspaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: TaskUser;
  assignees: TaskAssignee[];
};

export type TaskListData = {
  tasks: Task[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    limit: number;
  };
};

export type CreateTaskInput = {
  workspaceId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeIds?: string[];
};

export type CreateTaskResponse = ApiResponse<Task>;
export type TaskDetailResponse = ApiResponse<Task>;
export type TaskListResponse = ApiResponse<TaskListData>;

type ApiErrorData = {
  message?: string;
  errors?: unknown;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;

  if (typeof error === "object" && error !== null) {
    const err = error as FetchBaseQueryError & { data?: ApiErrorData | string };

    if (typeof err.data === "string") return err.data;
    if (err.data && typeof err.data === "object" && err.data.message) {
      return err.data.message;
    }

    if ("error" in err && typeof err.error === "string") {
      return err.error;
    }
  }

  return fallback;
};

// ─────────────────────────────────────────────
// RAW BASE QUERY  — attaches access token to every request
// ─────────────────────────────────────────────

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch (e) {
      console.warn("Could not read token", e);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// ─────────────────────────────────────────────
// AUTH BASE QUERY — auto-refreshes token on 401
// ─────────────────────────────────────────────

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const requestUrl = typeof args === "string" ? args : args.url;
  const is401 = result.error?.status === 401;
  const isRefreshCall = requestUrl.includes("/auth/refresh");

  if (is401 && !isRefreshCall) {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) return result;

    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST", body: { refreshToken } },
      api,
      extraOptions,
    );

    const newToken = (refreshResult.data as any)?.data?.accessToken;
    if (newToken) {
      await AsyncStorage.setItem("token", newToken);
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// ─────────────────────────────────────────────
// API SLICE
// ─────────────────────────────────────────────

export const API = createApi({
  reducerPath: "API",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Workspaces", "Tasks"],
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────

    login: builder.mutation<AuthPayload, LoginInput>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: AuthResponse) => response.data,
    }),

    signup: builder.mutation<SignUpResponse, SignUpInput>({
      query: (payload) => ({
        url: "/auth/signup",
        method: "POST",
        body: payload,
      }),
    }),

    logout: builder.mutation<BasicSuccessResponse, LogoutInput>({
      query: (payload) => ({
        url: "/auth/logout",
        method: "POST",
        body: payload,
      }),
    }),

    // ── Workspaces ────────────────────────────

    getAllWorkspaces: builder.query<Workspace[], void>({
      query: () => ({ url: "/workspaces", method: "GET" }),
      transformResponse: (response: WorkspacesResponse) => response.data,
      providesTags: ["Workspaces"],
    }),

    getWorkspaceById: builder.query<WorkspaceDetail, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "GET",
      }),
      transformResponse: (response: WorkspaceDetailResponse) => response.data,
      providesTags: ["Workspaces"],
    }),

    getTaskById: builder.query<
      Task,
      { workspaceId: string; taskId: string }
    >({
      query: ({ workspaceId, taskId }) => ({
        url: `/workspaces/${workspaceId}/tasks/${taskId}`,
        method: "GET",
      }),
      transformResponse: (response: TaskDetailResponse) => response.data,
      providesTags: ["Tasks"],
    }),

    getWorkspaceTasks: builder.query<
      TaskListData,
      { workspaceId: string }
    >({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/tasks`,
        method: "GET",
      }),
      transformResponse: (response: TaskListResponse) => response.data,
      providesTags: ["Tasks"],
    }),

    createWorkspace: builder.mutation<
      CreateWorkspaceResponse,
      CreateWorkspaceInput
    >({
      query: (payload) => ({
        url: "/workspaces",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Workspaces"],
    }),

    updateWorkspace: builder.mutation<
      UpdateWorkspaceResponse,
      UpdateWorkspaceInput
    >({
      query: ({ workspaceId, ...payload }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Workspaces"],
    }),

    deleteWorkspace: builder.mutation<
      BasicSuccessResponse,
      { workspaceId: string }
    >({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workspaces"],
    }),

    inviteWorkspaceMember: builder.mutation<
      BasicSuccessResponse,
      InviteMemberInput
    >({
      query: ({ workspaceId, email }) => ({
        url: `/workspaces/${workspaceId}/invite`,
        method: "POST",
        body: { email },
      }),
      invalidatesTags: ["Workspaces"],
    }),

    createTask: builder.mutation<CreateTaskResponse, CreateTaskInput>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks", "Workspaces"],
    }),

    deleteTask: builder.mutation<
      BasicSuccessResponse,
      { workspaceId: string; taskId: string }
    >({
      query: ({ workspaceId, taskId }) => ({
        url: `/workspaces/${workspaceId}/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks", "Workspaces"],
    }),

    // ── Members ───────────────────────────────

    removeWorkspaceMember: builder.mutation<
      BasicSuccessResponse,
      RemoveMemberInput
    >({
      query: ({ workspaceId, userId }) => ({
        url: `/workspaces/${workspaceId}/members`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Workspaces"],
    }),

    changeWorkspaceMemberRole: builder.mutation<
      BasicSuccessResponse,
      ChangeMemberRoleInput
    >({
      query: ({ workspaceId, userId, role }) => ({
        url: `/workspaces/${workspaceId}/members/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Workspaces"],
    }),
  }),
});

// ─────────────────────────────────────────────
// EXPORTED HOOKS
// ─────────────────────────────────────────────

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useGetAllWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useGetTaskByIdQuery,
  useLazyGetWorkspaceTasksQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useInviteWorkspaceMemberMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useRemoveWorkspaceMemberMutation,
  useChangeWorkspaceMemberRoleMutation,
} = API;