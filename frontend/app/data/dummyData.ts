export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  description: string;
  workspaceId: string;
  assigneeId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
  color: string;
  members: string[];
};

export type Member = {
  id: string;
  name: string;
  role: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

export type TaskComment = {
  id: string;
  taskId: string;
  memberId: string;
  text: string;
  time: string;
};

export type FileAttachment = {
  id: string;
  taskId: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
};

export const members: Member[] = [
  { id: 'm1', name: 'Ava Patel', role: 'Product Designer' },
  { id: 'm2', name: 'Leo Carter', role: 'Frontend Developer' },
  { id: 'm3', name: 'Noah Kim', role: 'Project Manager' },
  { id: 'm4', name: 'Emma Stone', role: 'QA Engineer' },
];

export const workspaces: Workspace[] = [
  {
    id: 'w1',
    name: 'Mobile Redesign',
    description: 'Improve app onboarding and dashboard UX.',
    color: '#0EA5E9',
    members: ['m1', 'm2', 'm3'],
  },
  {
    id: 'w2',
    name: 'Growth Sprint',
    description: 'Run experiments for activation and retention.',
    color: '#10B981',
    members: ['m2', 'm4'],
  },
  {
    id: 'w3',
    name: 'Ops Pipeline',
    description: 'Automate QA and release workflow.',
    color: '#F59E0B',
    members: ['m3', 'm4'],
  },
];

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Design dashboard wireframes',
    description: 'Create low and high fidelity wireframes for dashboard.',
    workspaceId: 'w1',
    assigneeId: 'm1',
    dueDate: 'Apr 24, 2026',
    priority: 'High',
    status: 'In Progress',
  },
  {
    id: 't2',
    title: 'Implement tab navigation polish',
    description: 'Finalize tab transitions and active state styles.',
    workspaceId: 'w1',
    assigneeId: 'm2',
    dueDate: 'Apr 25, 2026',
    priority: 'Medium',
    status: 'Todo',
  },
  {
    id: 't3',
    title: 'Write onboarding copy',
    description: 'Draft concise onboarding text for first time users.',
    workspaceId: 'w2',
    assigneeId: 'm3',
    dueDate: 'Apr 28, 2026',
    priority: 'Low',
    status: 'Done',
  },
  {
    id: 't4',
    title: 'Regression test release candidate',
    description: 'Validate core flows before release handoff.',
    workspaceId: 'w3',
    assigneeId: 'm4',
    dueDate: 'Apr 30, 2026',
    priority: 'High',
    status: 'Todo',
  },
];

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Task Updated',
    message: 'Leo moved "Implement tab navigation polish" to In Progress.',
    time: '5m ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'New Comment',
    message: 'Ava commented on "Design dashboard wireframes".',
    time: '20m ago',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Workspace Invite',
    message: 'You were invited to Growth Sprint workspace.',
    time: '1h ago',
    unread: false,
  },
];

export const comments: TaskComment[] = [
  {
    id: 'c1',
    taskId: 't1',
    memberId: 'm1',
    text: 'Uploaded first draft wireframes for review.',
    time: '09:10 AM',
  },
  {
    id: 'c2',
    taskId: 't1',
    memberId: 'm3',
    text: 'Looks great. Add one metric card for active users.',
    time: '09:22 AM',
  },
  {
    id: 'c3',
    taskId: 't2',
    memberId: 'm2',
    text: 'Will push animation improvements by EOD.',
    time: '10:05 AM',
  },
];

export const files: FileAttachment[] = [
  {
    id: 'f1',
    taskId: 't1',
    name: 'dashboard-wireframe-v3.fig',
    size: '2.1 MB',
    uploadedBy: 'Ava Patel',
    uploadedAt: 'Apr 20, 2026',
  },
  {
    id: 'f2',
    taskId: 't1',
    name: 'metrics-copy-notes.docx',
    size: '140 KB',
    uploadedBy: 'Noah Kim',
    uploadedAt: 'Apr 21, 2026',
  },
  {
    id: 'f3',
    taskId: 't2',
    name: 'tab-motion-preview.mp4',
    size: '8.9 MB',
    uploadedBy: 'Leo Carter',
    uploadedAt: 'Apr 21, 2026',
  },
];

export const getMemberById = (memberId: string) =>
  members.find((member) => member.id === memberId);

export const getWorkspaceById = (workspaceId: string) =>
  workspaces.find((workspace) => workspace.id === workspaceId);

export const getTaskById = (taskId: string) => tasks.find((task) => task.id === taskId);
