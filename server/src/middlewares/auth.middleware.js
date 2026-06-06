import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';
import redis from '../config/cache.js';
import { getUserByEmail } from '../services/user.service.js';
import { sendResponse } from '../utils/response.utlis.js';

/**
 * Load and validate the authenticated user from DB.
 * Returns null if user is deleted or inactive.
 */
async function loadAuthenticatedUser(email) {
    if (!email) return null;

    const user = await getUserByEmail(email);

    if (!user || user.deletedAt || user.isActive === false) {
        return null;
    }

    return user;
}

/**
 * Factory that creates a role-guard middleware accepting any of the given roles.
 */
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

            // Optimistic fast-path: role already known and allowed
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
                    statusCode: 403,
                    success: false,
                    message: 'Forbidden. Insufficient permissions.',
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
            console.error('Role guard error:', error.message);
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

/**
 * @middleware authUser
 * Validates the JWT cookie and attaches user context to req.user.
 * Redis blacklist check is gracefully skipped if Redis is unavailable.
 */
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

        // Verify JWT first — synchronous, no Redis dependency
        let decoded;
        try {
            decoded = jwt.verify(token, envConfig.JWT_SECRET);
        } catch (jwtErr) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: 'Unauthorized. Invalid or expired token.',
            });
        }

        // Redis blacklist check — skip gracefully if Redis is temporarily down
        try {
            const isBlacklisted = await redis.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return sendResponse({
                    res,
                    statusCode: 401,
                    success: false,
                    message: 'Unauthorized. Token has been revoked.',
                });
            }
        } catch (redisErr) {
            console.warn('[Auth] Redis unavailable for blacklist check, proceeding without it:', redisErr.message);
        }

        // Load full user from DB to verify they still exist and are active
        const user = await loadAuthenticatedUser(decoded.email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'User not found or account is inactive.',
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
        console.error('Auth middleware error:', error.message);
        return sendResponse({
            res,
            statusCode: 401,
            success: false,
            message: 'Unauthorized. Authentication failed.',
        });
    }
}

// ── Role guard exports ────────────────────────────────────────────────────────

/** Allow any of the given roles (variadic) */
const allowRoles = (...roles) => createRoleGuard(roles);

const isAdmin                    = createRoleGuard(['ADMIN']);
const isManager                  = createRoleGuard(['MANAGER']);
const isProcurementOfficer       = createRoleGuard(['PROCUREMENT_OFFICER']);
const isOfficerOrAdmin           = createRoleGuard(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']);
const isAdminOrProcurementOfficer = isOfficerOrAdmin; // alias
const isVendor                   = createRoleGuard(['VENDOR']);

export {
    authUser,
    allowRoles,
    isAdmin,
    isManager,
    isProcurementOfficer,
    isOfficerOrAdmin,
    isAdminOrProcurementOfficer,
    isVendor,
};
