"use strict";

const workspaceService = require("../services/workspace.service");
const { sendSuccess } = require("../utils/response");

/**
 * POST /api/workspaces
 * Create a new workspace
 */
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.validatedData;
    const ownerId = req.user.sub;

    const workspace = await workspaceService.createWorkspace({
      name,
      description,
      ownerId,
    });

    return sendSuccess(res, 201, "Workspace created successfully", workspace);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces
 * Get all workspaces for logged-in user
 */
const getAllWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const workspaces = await workspaceService.getAllWorkspaces(userId);

    return sendSuccess(res, 200, "Workspaces fetched successfully", workspaces);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:workspaceId
 * Get a single workspace
 */
const getWorkspaceById = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.sub;

    const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);

    return sendSuccess(res, 200, "Workspace fetched successfully", workspace);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId
 * Update a workspace
 */
const updateWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.sub;
    const updateData = req.validatedData;

    const workspace = await workspaceService.updateWorkspace(
      workspaceId,
      userId,
      updateData
    );

    return sendSuccess(res, 200, "Workspace updated successfully", workspace);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId
 * Soft delete a workspace
 */
const deleteWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.sub;

    await workspaceService.deleteWorkspace(workspaceId, userId);

    return sendSuccess(res, 200, "Workspace deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/members
 * Remove a member from workspace
 */
const removeMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const requesterId = req.user.sub;
    const { userId } = req.validatedData;

    await workspaceService.removeMember(workspaceId, requesterId, userId);

    return sendSuccess(res, 200, "Member removed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId/members/:userId/role
 * Change a member's role (OWNER only)
 */
const changeMemberRole = async (req, res, next) => {
  try {
    const { workspaceId, userId } = req.params;
    const requesterId = req.user.sub;
    const { role } = req.validatedData;

    const updated = await workspaceService.changeMemberRole(
      workspaceId,
      requesterId,
      userId,
      role
    );

    return sendSuccess(res, 200, "Member role updated successfully", updated);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces/:workspaceId/invite
 * Send an invitation email with a signed token (OWNER only)
 */
const inviteMemberHandler = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const requesterId = req.user.sub;
    const { email } = req.validatedData;

    // Create an in-app invitation (notification) instead of sending only an email.
    // This stores a workspace_invitations row that the invited user can fetch.
    const result = await workspaceService.createInvitation(
      workspaceId,
      requesterId,
      email,
    );

    return sendSuccess(res, 200, result.message, { id: result.id });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workspaces/accept-invite
 * Accept invitation token as the logged-in user
 */
const acceptInviteHandler = async (req, res, next) => {
  try {
    const { token } = req.validatedData;
    const currentUser = req.user;

    const result = await workspaceService.acceptInvite(token, currentUser);

    return sendSuccess(res, 200, "Invitation accepted successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/accept-invite?token=...
 * Accept invitation directly from email link for signed-up users
 */
const acceptInviteFromLinkHandler = async (req, res, next) => {
  try {
    const { token } = req.validatedQuery;

    const result = await workspaceService.acceptInviteFromLink(token);

    return sendSuccess(res, 200, "Invitation accepted successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 * Get all invitations for the logged-in user (inbox)
 */
const getInvitationsHandler = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const invitations = await workspaceService.getInvitationsByUser(userId);

    return sendSuccess(res, 200, "Invitations fetched successfully", invitations);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/:invitationId
 * Get a single invitation by ID
 */
const getInvitationHandler = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.sub;

    const invitation = await workspaceService.getInvitationById(invitationId, userId);

    return sendSuccess(res, 200, "Invitation fetched successfully", invitation);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:invitationId/read
 * Mark an invitation as read
 */
const markInvitationReadHandler = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.sub;

    const result = await workspaceService.markInvitationAsRead(invitationId, userId);

    return sendSuccess(res, 200, "Invitation marked as read", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/:invitationId/accept
 * Accept an invitation
 */
const acceptInvitationHandler = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.sub;

    const result = await workspaceService.acceptInvitation(invitationId, userId);

    return sendSuccess(res, 200, "Invitation accepted successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/:invitationId/decline
 * Decline an invitation
 */
const declineInvitationHandler = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.sub;

    const result = await workspaceService.declineInvitation(invitationId, userId);

    return sendSuccess(res, 200, "Invitation declined", result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  removeMember,
  changeMemberRole,
  inviteMemberHandler,
  acceptInviteFromLinkHandler,
  acceptInviteHandler,
  getInvitationsHandler,
  getInvitationHandler,
  markInvitationReadHandler,
  acceptInvitationHandler,
  declineInvitationHandler,
};