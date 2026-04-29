const { z } = require("zod");

const TaskStatus = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(255, "Title must be under 255 characters"),

  description: z
    .string()
    .trim()
    .max(5000, "Description must be under 5000 characters")
    .optional(),

  status: TaskStatus.optional(),

  priority: TaskPriority.optional(),

  dueDate: z
    .string()
    .datetime({ message: "Invalid date format. Use ISO 8601" })
    .optional()
    .nullable(),

  assigneeIds: z
    .array(z.string())
    .optional()
    .default([]),
});

const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title must be under 255 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "Description must be under 5000 characters")
      .optional()
      .nullable(),

    status: TaskStatus.optional(),

    priority: TaskPriority.optional(),

    dueDate: z
      .string()
      .datetime({ message: "Invalid date format. Use ISO 8601" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
  );

const listTasksSchema = z.object({
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  assigneeId: z.string().optional(),
  search: z.string().trim().optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  sortBy: z
    .enum(["dueDate", "priority", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const assignUserSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .min(1, "User ID is required"),
});

const removeAssigneeSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .min(1, "User ID is required"),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  assignUserSchema,
  removeAssigneeSchema,
};