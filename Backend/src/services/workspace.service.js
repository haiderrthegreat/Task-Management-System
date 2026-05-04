"use strict";

const { prisma } = require("../config/db");
const env = require("../config/env");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const inviteTokenSecret = process.env.INVITE_TOKEN_SECRET || env.jwt.accessSecret;
const appBaseUrl = process.env.APP_URL || `http://localhost:${env.port}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if a user is a member of a workspace and return their membership
 */
const getMembership = async (workspaceId, userId) => {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });
};

/**
 * Get workspace by ID — excludes soft deleted
 */
const getActiveWorkspace = async (workspaceId) => {
  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      deletedAt: null,
    },
  });
};

/**
 * Throw a formatted error with status code
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Mailtrap transport — configure via env vars
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT || 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ─── Create Workspace ─────────────────────────────────────────────────────────

const createWorkspace = async ({ name, description, ownerId }) => {
  const workspace = await prisma.$transaction(async (tx) => {
    const newWorkspace = await tx.workspace.create({
      data: {
        name,
        description,
        ownerId,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: newWorkspace.id,
        userId: ownerId,
        role: "OWNER",
      },
    });

    return newWorkspace;
  });

  return workspace;
};

// ─── Get All Workspaces ───────────────────────────────────────────────────────

const getAllWorkspaces = async (userId) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  return memberships
    .filter((m) => m.workspace.deletedAt === null || m.workspace.deletedAt === undefined)
    .map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.createdAt,
    }));
};

// ─── Get Single Workspace ─────────────────────────────────────────────────────

const getWorkspaceById = async (workspaceId, userId) => {
  const workspace = await getActiveWorkspace(workspaceId);

  if (!workspace) {
    throw createError("Workspace not found", 404);
  }

  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw createError("You do not have access to this workspace", 403);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    ...workspace,
    role: membership.role,
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
  };
};

// ─── Update Workspace ─────────────────────────────────────────────────────────

const updateWorkspace = async (workspaceId, userId, updateData) => {
  const workspace = await getActiveWorkspace(workspaceId);

  if (!workspace) {
    throw createError("Workspace not found", 404);
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.description !== undefined && { description: updateData.description }),
    },
  });

  return updated;
};

// ─── Delete Workspace (Soft Delete) ──────────────────────────────────────────

const deleteWorkspace = async (workspaceId, userId) => {
  const workspace = await getActiveWorkspace(workspaceId);

  if (!workspace) {
    throw createError("Workspace not found", 404);
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletedAt: new Date() },
  });
};

// ─── Remove Member ────────────────────────────────────────────────────────────

const removeMember = async (workspaceId, requesterId, targetUserId) => {
  const workspace = await getActiveWorkspace(workspaceId);

  if (!workspace) {
    throw createError("Workspace not found", 404);
  }

  // Cannot remove yourself as OWNER
  if (requesterId === targetUserId) {
    throw createError("Owner cannot remove themselves from the workspace", 400);
  }

  const targetMembership = await getMembership(workspaceId, targetUserId);
  if (!targetMembership) {
    throw createError("This user is not a member of the workspace", 404);
  }

  if (targetMembership.role === "OWNER") {
    throw createError("Cannot remove an owner from the workspace", 400);
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });
};

// ─── Change Member Role ───────────────────────────────────────────────────────

const changeMemberRole = async (workspaceId, requesterId, targetUserId, newRole) => {
  const workspace = await getActiveWorkspace(workspaceId);
  if (!workspace) throw createError("Workspace not found", 404);

  // Cannot change your own role
  if (requesterId === targetUserId) {
    throw createError("Owner cannot change their own role", 400);
  }

  const targetMembership = await getMembership(workspaceId, targetUserId);
  if (!targetMembership) {
    throw createError("This user is not a member of the workspace", 404);
  }

  if (targetMembership.role === "OWNER") {
    throw createError("Cannot change the role of another owner", 400);
  }

  const updated = await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
    data: { role: newRole },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    id: updated.id,
    role: updated.role,
    user: updated.user,
  };
};

// ─── Invite Member (signed token via email) ───────────────────────────────────

const inviteMember = async (workspaceId, requesterId, email) => {
  // Ensure workspace is active before issuing invite token.
  const workspace = await getActiveWorkspace(workspaceId);
  if (!workspace) throw createError("Workspace not found", 404);

  // Requirement: only already signed-up users can be invited to join.
  const invitee = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true },
  });

  if (!invitee) {
    throw createError("No user found with this email address. Please ask them to sign up first.", 404);
  }

  const existingMembership = await getMembership(workspaceId, invitee.id);
  if (existingMembership) {
    throw createError("User is already a member of this workspace", 409);
  }

  // Generate signed JWT invite token (expires in 7 days)
  const inviteToken = jwt.sign(
    { workspaceId, email: email.toLowerCase() },
    inviteTokenSecret,
    { expiresIn: "7d" }
  );

  const inviteLink = `${appBaseUrl}/invite?token=${inviteToken}`;

  await transporter.sendMail({
    from: `"TaskFlow" <no-reply@taskflow.dev>`,
    to: email,
    subject: `You've been invited to join "${workspace.name}" on TaskFlow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>You're invited!</h2>
        <p>You've been invited to join the workspace <strong>${workspace.name}</strong> on TaskFlow.</p>
        <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Accept Invitation
        </a>
        <p style="margin-top:16px;color:#888;font-size:12px;">This link expires in 7 days. If you did not expect this invitation, you can safely ignore it.</p>
      </div>
    `,
  });

  return { message: `Invitation sent to ${email}` };
};

// ─── Accept Invitation ────────────────────────────────────────────────────────

const acceptInvite = async (token, currentUser) => {
  let payload;
  try {
    payload = jwt.verify(token, inviteTokenSecret);
  } catch {
    throw createError("Invalid or expired invitation token", 400);
  }

  const { workspaceId, email } = payload;

  if (!workspaceId || !email) {
    throw createError("Invalid invitation token payload", 400);
  }

  if (!currentUser || !currentUser.sub || !currentUser.email) {
    throw createError("Authentication is required to accept invitations", 401);
  }

  // Prevent token forwarding by enforcing email identity match.
  if (currentUser.email.toLowerCase() !== email.toLowerCase()) {
    throw createError("This invitation does not belong to the logged-in user", 403);
  }

  const workspace = await getActiveWorkspace(workspaceId);
  if (!workspace) throw createError("Workspace no longer exists", 404);

  // Idempotent — already a member is fine
  const existingMembership = await getMembership(workspaceId, currentUser.sub);
  if (existingMembership) {
    return { message: "You are already a member of this workspace" };
  }

  const newMember = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: currentUser.sub,
      role: "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    id: newMember.id,
    role: newMember.role,
    user: newMember.user,
  };
};

/**
 * Accept invite directly from email link.
 * Requirement: only signed-up users can be added.
 */
const acceptInviteFromLink = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, inviteTokenSecret);
  } catch {
    throw createError("Invalid or expired invitation token", 400);
  }

  const { workspaceId, email } = payload;

  if (!workspaceId || !email) {
    throw createError("Invalid invitation token payload", 400);
  }

  const workspace = await getActiveWorkspace(workspaceId);
  if (!workspace) throw createError("Workspace no longer exists", 404);

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  if (!existingUser) {
    throw createError("No user found with this invitation email. Please sign up first.", 404);
  }

  const existingMembership = await getMembership(workspaceId, existingUser.id);
  if (existingMembership) {
    return { message: "You are already a member of this workspace" };
  }

  const newMember = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: existingUser.id,
      role: "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    id: newMember.id,
    role: newMember.role,
    user: newMember.user,
  };
};

// ─── Invitation Notifications (New In-App System) ────────────────────────────

/**
 * Create a workspace invitation as a notification
 * Replace email-based invitation with in-app notification
 */
const createInvitation = async (workspaceId, inviterId, inviteeEmail) => {
  const workspace = await getActiveWorkspace(workspaceId);
  if (!workspace) throw createError("Workspace not found", 404);

  // Find the invitee by email
  const invitee = await prisma.user.findUnique({
    where: { email: inviteeEmail.toLowerCase() },
    select: { id: true, email: true, name: true },
  });

  if (!invitee) {
    throw createError("No user found with this email address. Please ask them to sign up first.", 404);
  }

  const existingMembership = await getMembership(workspaceId, invitee.id);
  if (existingMembership) {
    throw createError("User is already a member of this workspace", 409);
  }

  // Check if invitation already exists and is pending
  const existingInvitation = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      inviteeId: invitee.id,
      status: "PENDING",
    },
  });

  if (existingInvitation) {
    throw createError("Invitation already sent to this user", 409);
  }

  // Create the invitation record
  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId,
      inviterId,
      inviteeId: invitee.id,
      inviteeEmail: invitee.email.toLowerCase(),
      status: "PENDING",
    },
    include: {
      workspace: { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true, email: true } },
      invitee: { select: { id: true, name: true, email: true } },
    },
  });

  // Emit Socket.io event to the invitee's notification room
  const { emitToUser } = require("../config/socket");
  emitToUser(invitee.id, "invitation:received", {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    inviterName: invitation.inviter.name,
    message: `${invitation.inviter.name} invited you to join "${invitation.workspace.name}"`,
  });

  return {
    id: invitation.id,
    message: `Invitation sent to ${invitee.email}`,
  };
};

/**
 * Get all invitations for a user (notifications inbox)
 */
const getInvitationsByUser = async (userId) => {
  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      inviteeId: userId,
    },
    include: {
      workspace: { select: { id: true, name: true, description: true } },
      inviter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    workspaceId: inv.workspace.id,
    workspaceName: inv.workspace.name,
    workspaceDescription: inv.workspace.description,
    inviterName: inv.inviter.name,
    inviterEmail: inv.inviter.email,
    message: `${inv.inviter.name} invited you to join "${inv.workspace.name}"`,
    status: inv.status,
    isRead: inv.isRead,
    respondedAt: inv.respondedAt,
    createdAt: inv.createdAt,
  }));
};

/**
 * Get a single invitation
 */
const getInvitationById = async (invitationId, userId) => {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: { select: { id: true, name: true, description: true } },
      inviter: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invitation) throw createError("Invitation not found", 404);

  if (invitation.inviteeId !== userId) {
    throw createError("This invitation does not belong to you", 403);
  }

  return {
    id: invitation.id,
    workspaceId: invitation.workspace.id,
    workspaceName: invitation.workspace.name,
    workspaceDescription: invitation.workspace.description,
    inviterName: invitation.inviter.name,
    inviterEmail: invitation.inviter.email,
    message: `${invitation.inviter.name} invited you to join "${invitation.workspace.name}"`,
    status: invitation.status,
    isRead: invitation.isRead,
    respondedAt: invitation.respondedAt,
    createdAt: invitation.createdAt,
  };
};

/**
 * Mark an invitation as read
 */
const markInvitationAsRead = async (invitationId, userId) => {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw createError("Invitation not found", 404);

  if (invitation.inviteeId !== userId) {
    throw createError("This invitation does not belong to you", 403);
  }

  const updated = await prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: { isRead: true },
  });

  return { success: true, isRead: updated.isRead };
};

/**
 * Accept an invitation and add user to workspace
 */
const acceptInvitation = async (invitationId, userId) => {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: true,
      inviter: { select: { id: true, name: true } },
    },
  });

  if (!invitation) throw createError("Invitation not found", 404);

  if (invitation.inviteeId !== userId) {
    throw createError("This invitation does not belong to you", 403);
  }

  if (invitation.status !== "PENDING") {
    throw createError(`Invitation is already ${invitation.status.toLowerCase()}`, 400);
  }

  // Check workspace still exists
  const workspace = await getActiveWorkspace(invitation.workspaceId);
  if (!workspace) throw createError("Workspace no longer exists", 404);

  // Add user to workspace as member
  const membershipResult = await prisma.$transaction(async (tx) => {
    // Update invitation status
    await tx.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: "ACCEPTED",
        isRead: true,
        respondedAt: new Date(),
      },
    });

    // Create workspace member
    const membership = await tx.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return membership;
  });

  // Notify the inviter via Socket.io
  const { emitToUser } = require("../config/socket");
  emitToUser(invitation.inviterId, "invitation:accepted", {
    workspaceId: invitation.workspaceId,
    workspaceName: workspace.name,
    acceptedByName: membershipResult.user.name,
    message: `${membershipResult.user.name} accepted your invitation to "${workspace.name}"`,
  });

  return {
    id: membershipResult.id,
    role: membershipResult.role,
    user: membershipResult.user,
  };
};

/**
 * Decline an invitation
 */
const declineInvitation = async (invitationId, userId) => {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true } },
    },
  });

  if (!invitation) throw createError("Invitation not found", 404);

  if (invitation.inviteeId !== userId) {
    throw createError("This invitation does not belong to you", 403);
  }

  if (invitation.status !== "PENDING") {
    throw createError(`Invitation is already ${invitation.status.toLowerCase()}`, 400);
  }

  const updated = await prisma.workspaceInvitation.update({
    where: { id: invitationId },
    data: {
      status: "DECLINED",
      isRead: true,
      respondedAt: new Date(),
    },
  });

  // Notify the inviter via Socket.io
  const { emitToUser } = require("../config/socket");
  emitToUser(invitation.inviterId, "invitation:declined", {
    workspaceId: invitation.workspace.id,
    workspaceName: invitation.workspace.name,
    message: `An invitation to "${invitation.workspace.name}" was declined`,
  });

  return { success: true, status: updated.status };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  removeMember,
  changeMemberRole,
  inviteMember,
  acceptInvite,
  acceptInviteFromLink,
  createInvitation,
  getInvitationsByUser,
  getInvitationById,
  markInvitationAsRead,
  acceptInvitation,
  declineInvitation,
};