import joi from "joi";
import { GenderEnum } from "../common/enum/user.enum.js";

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(4).max(50).required(),
      email: joi.string().required(),
      password: joi.string().required(),
      cPassword: joi.string().valid(joi.ref("password")).required(),
      gender: joi.string().valid(...Object.values(GenderEnum)).required9,
    })
    .required(),
};

export const logInSchema = {
  body: joi
    .object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    })
    .required(),
  query: joi.object({
    x: joi.number().min(10).required(),
  }),
};
