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

    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized. blacklisted token.",
        success: false,
        error: "Token is blacklisted",
      });
    }

    const decoded = jwt.verify(token, envConfig.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.log("Auth middleware error:", error);
    return res.status(401).json({
      message: "Unauthorized. Invalid token.",
      error: error.message,
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

export { authUser, isAdmin, isManager };
