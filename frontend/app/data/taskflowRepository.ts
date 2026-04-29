import {
  comments,
  files,
  getMemberById,
  getTaskById,
  getWorkspaceById,
  members,
  notifications,
  tasks,
  workspaces,
} from './dummyData';

export const taskflowRepository = {
  getMembers: () => members,
  getMemberById,
  getWorkspaces: () => workspaces,
  getWorkspaceById,
  getTasks: () => tasks,
  getTaskById,
  getNotifications: () => notifications,
  getCommentsByTaskId: (taskId: string) => comments.filter((comment) => comment.taskId === taskId),
  getFilesByTaskId: (taskId: string) => files.filter((file) => file.taskId === taskId),
};
