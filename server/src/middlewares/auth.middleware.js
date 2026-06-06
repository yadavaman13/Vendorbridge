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

export {
    authUser,
    allowRoles,
    isAdmin,
    isManager,
    isProcurementOfficer,
    isAdminOrProcurementOfficer,
};
