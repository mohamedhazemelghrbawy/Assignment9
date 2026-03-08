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
import {
  SALT_ROUNDS,
  SECRET_KEY,
  REFRESH_SECRET_KEY,
  PREFIX,
} from "../../../config/config.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import fs from "node:fs";

export const signUp = async (req, res, next) => {
  try {
    const { userName, email, password, gender, phone } = req.body;

    if (await db_service.findOne({ model: userModel, filter: { email } })) {
      throw new Error("Email already exists");
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "sara7a_app" },
    );

    const user = await db_service.create({
      model: userModel,
      data: {
        userName,
        email,
        password: Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
        gender,
        phone: encryptAsymmetric(phone),
        profilePicture: { secure_url, public_id },
      },
    });

    successResponse({ res, status: 201, data: user });
  } catch (err) {
    console.log("Signup Error:", err);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log("Error deleting local file:", err);
      });
    }

    if (uploadedFile && uploadedFile.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedFile.public_id);
      } catch (Err) {
        console.log("Error deleting Cloudinary file:", Err);
      }
    }

    next(err);
  }
};
export const refresh_token = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("token not exist");
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("Invalid toden prefix");
  }
  const decoded = verifyToken({
    token,
    secret_key: "secretKey",
  });
  if (!decoded || !decoded?.id) {
    throw new Error("Invalid token");
  }
  const user = await db_service.findOne({
    model: userModel,
    id: decoded.id,
    select: "-password",
  });
  if (!user) {
    throw new Error("user not exist", { cause: 400 });
  }
  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: 60 * 5 },
  });
  successResponse({
    res,
    message: "success login",
    data: { ...user._doc, access_token },
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
  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: 60 * 5 },
  });
  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: { expiresIn: "1y" },
  });
  successResponse({
    res,
    message: "success login",
    data: { ...user._doc, access_token, refresh_token },
  });
};
export const getProfile = async (req, res, next) => {
  successResponse({
    res,
    message: "done",
    data: req.user,
  });
};
export const shareProfile = async (req, res, next) => {
  const { id } = req.params;
  const user = await db_service.findOne({
    model: userModel,
    filter: { id },
    select: "-password",
  });
  if (!user) {
    throw new Error("user not found");
  }
  user.phone.decrypt(user.phone);
  successResponse({
    res,
    message: "done",
    data: user,
  });
};
export const updateProfile = async (req, res, next) => {
  let { firstName, lastName, gender, phone } = req.body;

  if (phone) {
    phone = encrypt(phone);
  }

  const user = await db_service.findOndeAndUpdate({
    model: userModel,
    filter: { _id: req.user._id },
    update: { firstName, lastName, gender, phone },
  });
  if (!user) {
    throw new Error("user not found");
  }
  user.phone.decrypt(user.phone);
  successResponse({
    res,
    message: "done",
    data: user,
  });
};

export const updatePassword = async (req, res, next) => {
  let { oldPassword, newPassword } = req.body;

  if (!Compare({ plainText: oldPassword, cipherText: req.user.password })) {
    throw new Error("invalid old password");
  }
  const hash = Hash({ plainText: newPassword });
  req.user.password = hash;
  req.user.save();
  successResponse({
    res,
    message: "done",
  });
};
