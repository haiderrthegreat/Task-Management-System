const { prisma } = require("../config/db");

/**
 * RBAC middleware factory.
 * Usage: checkWorkspaceRole(["OWNER"]) or checkWorkspaceRole(["OWNER", "MEMBER"])
 * Reads :workspaceId (or :id) from route params.
 */
const checkWorkspaceRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id;
      const userId = req.user.sub;

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: "Workspace ID is required",
        });
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this workspace",
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
        });
      }

      // Attach membership to request for downstream use
      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkWorkspaceRole };