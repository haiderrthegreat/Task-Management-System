"use strict";

const { z } = require("zod");

const createCommentSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be under 2000 characters"),
});

const updateCommentSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be under 2000 characters"),
});

module.exports = { createCommentSchema, updateCommentSchema };