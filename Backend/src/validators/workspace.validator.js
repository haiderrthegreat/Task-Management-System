"use strict";

const { z } = require("zod");

const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be under 500 characters")
    .optional(),
});

const updateWorkspaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description must be under 500 characters")
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: "At least one field (name or description) must be provided" }
  );

const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
});

const acceptInviteSchema = z.object({
  token: z
    .string({ required_error: "Invitation token is required" })
    .min(1, "Invitation token is required"),
});

const removeMemberSchema = z.object({
  userId: z
    .string({ required_error: "User ID is required" })
    .min(1, "User ID is required"),
});

const changeRoleSchema = z.object({
  role: z.enum(["MEMBER", "OWNER"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be MEMBER or OWNER",
  }),
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
};