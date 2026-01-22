/**
 * Role-based access control middleware
 * Hierarchy: admin (3) > member (2) > viewer (1)
 */

const models = require("../models");

const roleHierarchy = {
  admin: 3,
  member: 2,
  viewer: 1
};

/**
 * Check if user has required role level
 * @param {string|array} requiredRoles - Required role(s)
 * @returns {function} Express middleware
 */
function requireRole(...requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const hasRequiredRole = requiredRoles.some(role => {
      const requiredLevel = roleHierarchy[role] || 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        ok: false, 
        error: `Access denied. Required role(s): ${requiredRoles.join(", ")}` 
      });
    }

    next();
  };
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }

  next();
}

/**
 * Check if user is member or admin
 */
function requireMember(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  if (!["admin", "member"].includes(req.user.role)) {
    return res.status(403).json({ 
      ok: false, 
      error: "Member access required" 
    });
  }

  next();
}

/**
 * Check if user owns a board or is admin
 * Assumes board ID is in req.params.id or req.body.boardId
 */
function canModifyBoard(req, res, next) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const boardId = req.params.id || req.body.boardId;
    if (!boardId) {
      return res.status(400).json({ ok: false, error: "Board ID required" });
    }

    try {
      const board = await models.Board.findById(boardId);
      if (!board) {
        return res.status(404).json({ ok: false, error: "Board not found" });
      }

      // Admin can modify any board, owner can modify their board, members can modify if added
      const isOwner = board.owner.toString() === req.user._id.toString();
      const isMember = board.members.some(m => m.toString() === req.user._id.toString());
      const isAdmin = req.user.role === "admin";

      if (!isAdmin && !isOwner && !isMember) {
        return res.status(403).json({ 
          ok: false, 
          error: "You do not have permission to modify this board" 
        });
      }

      req.board = board;
      next();
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Failed to verify permissions" });
    }
  };
}

/**
 * Check if user can modify a ticket
 * Admin, owner, or assignee can modify
 */
function canModifyTicket(req, res, next) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const ticketId = req.params.id;
    if (!ticketId) {
      return res.status(400).json({ ok: false, error: "Ticket ID required" });
    }

    try {
      const ticket = await models.Ticket.findById(ticketId).populate("board");
      if (!ticket) {
        return res.status(404).json({ ok: false, error: "Ticket not found" });
      }

      const isAdmin = req.user.role === "admin";
      const isAssignee = ticket.assignee && ticket.assignee.toString() === req.user._id.toString();
      const isBoardOwner = ticket.board && ticket.board.owner.toString() === req.user._id.toString();
      const isBoardMember = ticket.board && ticket.board.members.some(m => m.toString() === req.user._id.toString());

      if (!isAdmin && !isAssignee && !isBoardOwner && !isBoardMember) {
        return res.status(403).json({ 
          ok: false, 
          error: "You do not have permission to modify this ticket" 
        });
      }

      req.ticket = ticket;
      next();
    } catch (err) {
      console.error("canModifyTicket error:", err);
      return res.status(500).json({ ok: false, error: "Failed to verify permissions" });
    }
  };
}

module.exports = {
  requireRole,
  requireAdmin,
  requireMember,
  canModifyBoard: (req, res, next) => {
    return canModifyBoard(req, res, next)(req, res, next);
  },
  canModifyTicket: (req, res, next) => {
    return canModifyTicket(req, res, next)(req, res, next);
  }
};
