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
import { DEFAULT_UNIVERSE, OAuth2Client } from "google-auth-library";
import { SALT_ROUNDS, SECRET_KEY } from "../../../config/config.service.js";

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
      password: Hash({
        plainText: password,
        salt_rounds: SALT_ROUNDS,
      }),
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
    secret_key: SECRET_KEY,
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
export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "635214117950-0gmovhia7h6ncc091ucrce78i6jlafnj.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();

  const { email, email_verified, name, picture } = payload;
  let user = await db_service.findOne({ model: userModel, filter: { email } });

  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        email,
        confirmed: email_verified,
        userName: name,
        profilePicture: picture,
        provider: providerEnum.google,
      },
    });
  }
  if (user.provider == providerEnum.system) {
    throw new Error("please");
  }

  const token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "success login",
    data: { ...user._doc, token },
  });
};
