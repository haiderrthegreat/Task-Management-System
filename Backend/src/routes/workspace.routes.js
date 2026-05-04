"use strict";

const { Router } = require("express");
const workspaceController = require("../controllers/workspace.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkWorkspaceRole } = require("../middlewares/rbac.middleware");
const { validate, validateQuery } = require("../middlewares/validate.middleware");
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  removeMemberSchema,
  changeRoleSchema,
  acceptInvitationSchema,
  declineInvitationSchema,
} = require("../validators/workspace.validator");

const router = Router();

// ─── Public invite acceptance route (mail link) ─────────────────────────────

router.get(
  "/accept-invite",
  validateQuery(acceptInviteSchema),
  workspaceController.acceptInviteFromLinkHandler,
);

// ─── All routes require authentication ───────────────────────────────────────

router.use(authenticate);

// POST /api/workspaces/accept-invite  → Accept invite via signed token
router.post(
  "/accept-invite",
  validate(acceptInviteSchema),
  workspaceController.acceptInviteHandler,
);

// ─── Notifications / Invitations (In-App System) ──────────────────────────────
// NOTE: These must come BEFORE the /:workspaceId routes to avoid being caught by the catch-all

// GET    /api/workspaces/notifications          → Get all invitations for user
router.get(
  "/notifications",
  workspaceController.getInvitationsHandler,
);

// GET    /api/workspaces/notifications/:invitationId     → Get single invitation
router.get(
  "/notifications/:invitationId",
  workspaceController.getInvitationHandler,
);

// PATCH  /api/workspaces/notifications/:invitationId/read   → Mark invitation as read
router.patch(
  "/notifications/:invitationId/read",
  workspaceController.markInvitationReadHandler,
);

// POST   /api/workspaces/notifications/:invitationId/accept  → Accept invitation
router.post(
  "/notifications/:invitationId/accept",
  workspaceController.acceptInvitationHandler,
);

// POST   /api/workspaces/notifications/:invitationId/decline → Decline invitation
router.post(
  "/notifications/:invitationId/decline",
  workspaceController.declineInvitationHandler,
);

// ─── Workspace CRUD ───────────────────────────────────────────────────────────

// POST   /api/workspaces          → Create workspace
router.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace,
);

// GET    /api/workspaces          → Get all workspaces for user
router.get("/", workspaceController.getAllWorkspaces);

// GET    /api/workspaces/:workspaceId   → Get single workspace (any member)
router.get("/:workspaceId", workspaceController.getWorkspaceById);

// PATCH  /api/workspaces/:workspaceId  → Update workspace (OWNER only)
router.patch(
  "/:workspaceId",
  checkWorkspaceRole(["OWNER"]),
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace,
);

// DELETE /api/workspaces/:workspaceId  → Soft delete workspace (OWNER only)
router.delete(
  "/:workspaceId",
  checkWorkspaceRole(["OWNER"]),
  workspaceController.deleteWorkspace,
);

// ─── Member Management ────────────────────────────────────────────────────────

// POST   /api/workspaces/:workspaceId/invite          → Send invite email (OWNER only)
router.post(
  "/:workspaceId/invite",
  checkWorkspaceRole(["OWNER"]),
  validate(inviteMemberSchema),
  workspaceController.inviteMemberHandler,
);

// DELETE /api/workspaces/:workspaceId/members         → Remove member (OWNER only)
router.delete(
  "/:workspaceId/members",
  checkWorkspaceRole(["OWNER"]),
  validate(removeMemberSchema),
  workspaceController.removeMember,
);

// PATCH  /api/workspaces/:workspaceId/members/:userId/role  → Change role (OWNER only)
router.patch(
  "/:workspaceId/members/:userId/role",
  checkWorkspaceRole(["OWNER"]),
  validate(changeRoleSchema),
  workspaceController.changeMemberRole,
);

module.exports = router;
