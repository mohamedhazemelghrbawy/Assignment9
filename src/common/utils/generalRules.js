import joi from "joi";

export const general_rules = {
  email: joi.string().required(),
  password: joi
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    ),
  cPassword: joi.string().valid(joi.ref("password")),
  id: joi.string().custom((value, helper) => {
    const isValid = Types.ObjectId.isValid(value);
    return isValid ? value : helper.message("invalid id");
  }),
  file: joi
    .object({
      fieldname: joi.string(),
      originalname: joi.string(),
      mimetype: joi.string(),
      destenation: joi.string(),
      filename: joi.string(),
      path: joi.string(),
      size: joi.number(),
    })
    .messages({
      "any-required": "attachment is required",
    }),
};
