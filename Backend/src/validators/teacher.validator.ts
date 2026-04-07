import { body } from "express-validator";

export const createTeacherValidation = [
  body("fullname")
    .trim()
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Số điện thoại không được để trống")
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không hợp lệ"),

  body("degree")
    .trim()
    .notEmpty()
    .withMessage("Bằng cấp không được để trống")
    .isLength({ min: 2, max: 200 })
    .withMessage("Bằng cấp phải từ 2-200 ký tự"),

  body("isTeaching")
    .optional()
    .isBoolean()
    .withMessage("isTeaching phải là boolean"),
];

export const updateTeacherValidation = [
  body("fullname")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("password")
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không hợp lệ"),

  body("degree")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Bằng cấp phải từ 2-200 ký tự"),

  body("isTeaching")
    .optional()
    .isBoolean()
    .withMessage("isTeaching phải là boolean"),
];
