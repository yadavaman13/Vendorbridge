import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';
import redis from '../config/cache.js';
import { getUserByEmail } from '../services/user.service.js';
import { sendResponse } from '../utils/response.utlis.js';

async function loadAuthenticatedUser(email) {
    if (!email) {
        return null;
    }

    const user = await getUserByEmail(email);

    if (!user || user.deletedAt || user.isActive === false) {
        return null;
    }

    return user;
}

function createRoleGuard(allowedRoles) {
    return async function roleGuard(req, res, next) {
        try {
            if (!req.user?.email) {
                return sendResponse({
                    res,
                    statusCode: 401,
                    success: false,
                    message: 'Unauthorized. Please login first.',
                });
            }

            const user =
                req.user?.role && allowedRoles.includes(req.user.role)
                    ? req.user
                    : await loadAuthenticatedUser(req.user.email);

            if (!user) {
                return sendResponse({
                    res,
                    statusCode: 404,
                    success: false,
                    message: 'User not found.',
                });
            }

            if (!allowedRoles.includes(user.role)) {
                return sendResponse({
                    res,
                    statusCode: 401,
                    success: false,
                    message: 'Unauthorized for this action.',
                });
            }

            req.user = {
                ...req.user,
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            };

            next();
        } catch (error) {
            console.error('Role guard error:', error);
            return sendResponse({
                res,
                statusCode: 500,
                success: false,
                message: 'Failed to authorize request.',
                error: 'Internal server error',
            });
        }
    };
}

async function authUser(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: 'Unauthorized. No token provided.',
            });
        }

        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: 'Unauthorized. Token is blacklisted.',
                error: 'Token is blacklisted',
            });
        }

        const decoded = jwt.verify(token, envConfig.JWT_SECRET);
        const user = await loadAuthenticatedUser(decoded.email);

        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'User not found.',
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return sendResponse({
            res,
            statusCode: 401,
            success: false,
            message: 'Unauthorized. Invalid token.',
            error: error.message,
        });
    }
}

const allowRoles = (...roles) => createRoleGuard(roles);
const isAdmin = createRoleGuard(['ADMIN']);
const isManager = createRoleGuard(['MANAGER']);
const isProcurementOfficer = createRoleGuard(['PROCUREMENT_OFFICER']);
const isAdminOrProcurementOfficer = createRoleGuard([
    'ADMIN',
    'PROCUREMENT_OFFICER',
]);

<<<<<<< HEAD
export {
    authUser,
    allowRoles,
    isAdmin,
    isManager,
    isProcurementOfficer,
    isAdminOrProcurementOfficer,
};
=======
    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Forbidden. Admins only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isAdmin error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
}

async function isManager(req, res, next) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.role !== "MANAGER") {
      return res
        .status(403)
        .json({ message: "Forbidden. Managers only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isManager error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
}

async function isOfficerOrAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.role !== "ADMIN" && user.role !== "PROCUREMENT_OFFICER") {
      return res
        .status(403)
        .json({ message: "Forbidden. Admins or Procurement Officers only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isOfficerOrAdmin error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
}

async function isVendor(req, res, next) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.role !== "VENDOR") {
      return res
        .status(403)
        .json({ message: "Forbidden. Vendors only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isVendor error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
}

export { authUser, isAdmin, isManager, isOfficerOrAdmin, isVendor };
>>>>>>> 4599a4889d72a293fb2fd0a99a4eafb8b1d3b98f
