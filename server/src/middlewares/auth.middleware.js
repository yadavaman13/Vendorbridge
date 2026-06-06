import jwt from "jsonwebtoken";
import envConfig from "../config/envConfig.js";
import redis from "../config/cache.js";

async function authUser(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. No token provided.",
        success: false,
      });
    }

    // Verify JWT first — this is synchronous and doesn't need Redis
    let decoded;
    try {
      decoded = jwt.verify(token, envConfig.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        message: "Unauthorized. Invalid or expired token.",
        success: false,
      });
    }

    // Check Redis blacklist — gracefully skip if Redis is temporarily unavailable
    try {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          message: "Unauthorized. Token has been revoked.",
          success: false,
        });
      }
    } catch (redisErr) {
      // Redis is down/reconnecting — log the warning but don't block the request
      console.warn("[Auth] Redis unavailable for blacklist check, proceeding without it:", redisErr.message);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      message: "Unauthorized. Authentication failed.",
      success: false,
    });
  }
}

async function isAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden. Admins only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isAdmin error:", err.message);
    return res.status(500).json({ message: "Internal server error", success: false });
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
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.role !== "MANAGER") {
      return res.status(403).json({ message: "Forbidden. Managers only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isManager error:", err.message);
    return res.status(500).json({ message: "Internal server error", success: false });
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
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.role !== "ADMIN" && user.role !== "PROCUREMENT_OFFICER" && user.role !== "MANAGER") {
      return res.status(403).json({
        message: "Forbidden. Admins, Managers, or Procurement Officers only.",
        success: false,
      });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isOfficerOrAdmin error:", err.message);
    return res.status(500).json({ message: "Internal server error", success: false });
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
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.role !== "VENDOR") {
      return res.status(403).json({ message: "Forbidden. Vendors only.", success: false });
    }

    req.user = { ...req.user, role: user.role, id: user.id };
    next();
  } catch (err) {
    console.error("isVendor error:", err.message);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
}

export { authUser, isAdmin, isManager, isOfficerOrAdmin, isVendor };
