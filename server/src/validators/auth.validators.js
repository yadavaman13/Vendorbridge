import { body, validationResult } from 'express-validator';
import { sendResponse } from '../utils/response.utlis.js';

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse({
            res,
            statusCode: 400,
            success: false,
            message: 'Validation failed.',
            error: errors.array(),
        });
    }

    next();
}

const emailValidator = body('email')
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage('Valid email is required.');

const passwordValidator = body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .withMessage(
        'Password must include at least one uppercase letter, one number, and one special character.',
    );

const confirmPasswordValidator = body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Confirm password is required.')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.');

const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    emailValidator,
    passwordValidator,
    validateRequest,
];

const vendorRegisterValidator = [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    emailValidator,
    passwordValidator,
    body('phone')
        .trim()
        .notEmpty()
        .isMobilePhone()
        .withMessage('Valid phone number is required.'),
    body('companyName')
        .trim()
        .notEmpty()
        .withMessage('Company name is required.'),
    body('gstNumber')
        .trim()
        .notEmpty()
        .isLength({ min: 5 })
        .withMessage('GST number is required.'),
    body('categoryId')
        .trim()
        .notEmpty()
        .isUUID()
        .withMessage('Valid categoryId (UUID) is required.'),
    validateRequest,
];

const loginValidator = [emailValidator, passwordValidator, validateRequest];

const forgotPasswordValidator = [emailValidator, validateRequest];

const resetPasswordValidator = [
    emailValidator,
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters long.'),
    passwordValidator,
    confirmPasswordValidator,
    validateRequest,
];

export {
    validateRequest,
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    vendorRegisterValidator,
};
