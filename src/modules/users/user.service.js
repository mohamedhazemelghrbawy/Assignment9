import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { providerEnum } from "../../common/enum/user.enum.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";

import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import jwt from "jsonwebtoken";
import {
  decryptAsymmetric,
  encryptAsymmetric,
} from "../../common/utils/security/Asymmetric.security.js";
import {
  GenerateToken,
  verifyToken,
} from "../../common/utils/token.service.js";

export const signUp = async (req, res, next) => {
  const { userName, email, password, cPassword, gender, phone } = req.body;
  if (password !== cPassword) {
    throw new Error("Invalid Passoword");
  }
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("Email already Exist");
  }
  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({ plainText: password }),
      cPassword,
      gender,
      //  phone: encrypt(phone),
      phone: encryptAsymmetric(phone),
    },
  });
  successResponse({ res, status: 201, data: user });
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    throw new Error("Invalid Email");
  }
  if (!Compare({ plainText: password, cipherText: user.password })) {
    throw new Error("Invalid password", { cause: 400 });
  }
  const token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: "secretKey",
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "success login",
    data: { ...user._doc, token },
  });
};
export const getProfile = async (req, res, next) => {
  successResponse({
    res,
    message: "done",
    data: req.user,
    // data: decoded,
  });
};
