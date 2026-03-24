import joi from "joi";
import { GenderEnum } from "../common/enum/user.enum.js";
import { general_rules } from "../common/utils/generalRules.js";

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(4).max(50).required(),
      email: general_rules.email.required(),
      password: general_rules.password.required(),
      cPassword: general_rules.cPassword.required(),
      gender: joi
        .string()
        .valid(...Object.values(GenderEnum))
        .required(),
    })
    .required(),

  file: general_rules.file.required(),

  files: joi.array().max(7).items(general_rules.file.required()),

  files: joi
    .object({
      attachment: joi.array().max(1).items(general_rules.file.required()),
      attachments: joi.array().max(6).items(general_rules.file.required()),
    })
    .required(),
};

export const logInSchema = {
  body: joi
    .object({
      email: general_rules.email.required(),
      password: general_rules.password.required(),
    })
    .required(),
};
export const shareProfileSchema = {
  params: joi
    .object({
      id: general_rules.id.required(),
    })
    .required(),
};
export const updateProfileSchema = {
  body: joi
    .object({
      gender: joi.string().valid(...Object.values(GenderEnum)),
      phone: joi.string(),
      firstName: joi.string().min(4).max(50),
      lastName: joi.string().min(4).max(50),
    })
    .required(),
};
export const updatePasswordSchema = {
  body: joi
    .object({
      newPassword: general_rules.password.required(),
      cPassword: joi.string().valid(joi.ref("newPassword")),
      oldPassword: joi.string(),
    })
    .required(),
};
export const confirmEmailSchmea = {
  body: joi
    .object({
      email: general_rules.email.required(),
      otp: joi.string().length(6).required(),
    })
    .required(),
};
