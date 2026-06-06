import { body, param, query, validationResult } from "express-validator";

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed.",
      success: false,
      errors: errors.array(),
    });
  }

  next();
}

const allowedRoles = ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"];

const userIdParamValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid user id is required."),
  validateRequest,
];

const listUsersValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100."),
  validateRequest,
];

const updateUserRoleValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid user id is required."),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required.")
    .isIn(allowedRoles)
    .withMessage(
      "Role must be one of ADMIN, PROCUREMENT_OFFICER, MANAGER, or VENDOR.",
    ),
  validateRequest,
];

const updateUserValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid user id is required."),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters."),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("A valid email address is required."),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be a 10 digit number."),
  body("role")
    .optional()
    .trim()
    .isIn(allowedRoles)
    .withMessage(
      "Role must be one of ADMIN, PROCUREMENT_OFFICER, MANAGER, or VENDOR.",
    ),
  validateRequest,
];

export {
  validateRequest,
  listUsersValidator,
  userIdParamValidator,
  updateUserRoleValidator,
  updateUserValidator,
};
