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
import { randomUUID } from "crypto";
import { keys, set } from "../../DB/redis/redis.service.js";
//

//

//
export const signUp = async (req, res, next) => {
  let uploadedFiles = [];
  try {
    const { userName, email, password, gender, phone } = req.body;

    if (await db_service.findOne({ model: userModel, filter: { email } })) {
      throw new Error("Email already exists");
    }

    const newImages = req.files?.attachments?.length || 0;

    if (newImages !== 2) {
      throw new Error("Cover pictures must be exactly 2");
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.attachment[0].path,
      { folder: "sara7a_app/profilePicture" },
    );
    uploadedFiles.push(public_id);
    // let uploadedFiles = [];
    let arr_paths = [];
    for (const file of req.files.attachments) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "sara7a_app/coverPicture" },
      );

      arr_paths.push({ secure_url, public_id });
      uploadedFiles.push(public_id);
    }

    const user = await db_service.create({
      model: userModel,
      data: {
        userName,
        email,
        password: Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
        gender,
        phone: encryptAsymmetric(phone),
        // phone: encrypt(phone),

        profilePicture: { secure_url, public_id },
        coverPicture: arr_paths,
      },
    });

    successResponse({ res, status: 201, data: user });
  } catch (err) {
    console.log("Signup Error:", err);
    if (req.files) {
      for (const key in req.files) {
        req.files[key].forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.log("Error deleting local file:", err);
          });
        });
      }
    }
    if (uploadedFiles.length) {
      for (const public_id of uploadedFiles) {
        try {
          await cloudinary.uploader.destroy(public_id);
        } catch (err) {
          console.log("Error deleting Cloudinary file:", err);
        }
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
    secret_key: SECRET_KEY,
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
  const revokeToken = await db_service.findOne({
    model: revokeTokenModel,
    filter: { tokenId: decoded.jti },
  });

  if (revokeToken) {
    throw new Error("inValid token revoked");
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

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "success login",
    data: { ...user._doc, access_token },
  });
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    throw new Error("Invalid Email");
  }
  console.log(password);
  console.log(user.password);

  if (!Compare({ plainText: password, cipherText: user.password })) {
    throw new Error("Invalid password", { cause: 400 });
  }
  const jwtid = randomUUID();

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: 60 * 20, jwtid },
  });
  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: { expiresIn: "1y", jwtid },
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
    filter: { _id: id },
    options: { select: "-password", select: "-visitCount" },
  });
  if (!user) {
    throw new Error("user not found");
  }
  user.visitCount = (user.visitCount || 0) + 1;
  await user.save();
  // user.phone = decryptAsymmetric(user.phone);
  successResponse({
    res,
    message: "done",
    data: { ...user._doc },
  });
};
export const updateProfile = async (req, res, next) => {
  try {
    let { firstName, lastName, gender, phone } = req.body;

    if (phone) {
      phone = encrypt(phone);
    }

    let profilePicture;
    let arr_paths = [];
    let uploadedFiles = [];

    const user = await db_service.findOne({
      model: userModel,
      filter: { _id: req.user._id },
    });
    if (!user) {
      throw new Error("user not found");
    }

    if (req.files?.attachment && user.profilePicture?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.profilePicture.public_id);
      } catch (err) {
        console.log("Error deleting old profile picture:", err);
      }

      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.attachment[0].path,
        { folder: "sara7a_app/profilePicture" },
      );
      profilePicture = { secure_url, public_id };
      uploadedFiles.push(public_id);
    }
    const newImages = req.files?.attachments?.length || 0;

    if (newImages !== 2) {
      throw new Error("Cover pictures must be exactly 2");
    }
    if (req.files?.attachments && user.coverPicture?.length) {
      for (const old of user.coverPicture) {
        try {
          if (old.public_id) await cloudinary.uploader.destroy(old.public_id);
        } catch (err) {
          console.log("Error deleting old cover picture:", err);
        }
      }

      for (const file of req.files.attachments) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          { folder: "sara7a_app/coverPicture" },
        );
        arr_paths.push({ secure_url, public_id });
        uploadedFiles.push(public_id);
      }
    }

    const updatedUser = await db_service.findOndeAndUpdate({
      model: userModel,
      filter: { _id: req.user._id },
      update: {
        firstName,
        lastName,
        gender,
        phone,
        ...(profilePicture && { profilePicture }),
        ...(arr_paths.length && { coverPicture: arr_paths }),
      },
      options: { new: true },
    });

    successResponse({
      res,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    if (uploadedFiles.length) {
      for (const public_id of uploadedFiles) {
        try {
          await cloudinary.uploader.destroy(public_id);
        } catch (err) {
          console.log("Error deleting newly uploaded file:", err);
        }
      }
    }
    next(err);
  }
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

export const removeProfilePicture = async (req, res, next) => {
  try {
    const user = await db_service.findOne({
      model: userModel,
      filter: { _id: req.user._id },
    });
    if (!user) throw new Error("User not found");

    if (user.profilePicture?.path) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);

      // fs.unlink(user.profilePicture?.path, (err) => {
      //   if (err) console.log("Error deleting local file:", err);
      //});
    }
    user.profilePicture = null;
    await user.save();
    successResponse({ res, message: "Profile image removed successfully" });
  } catch (error) {
    console.log("error in delete profile picture", error);
  }
};

export const logout = async (req, res, next) => {
  const { flag } = req.query;

  if (flag == "all") {
    req.user.changeCredential = new Date();
    await req.user.save();

    await db_service.deleteMany(await keys(get_key({ userId: req.user._id })));
  } else {
    await set({
      key: revoked_key({ userId: req.user._id, jti: req.decoded.jti }),
      value: `${(req.decoded, jti)}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }
  successResponse({ res });
};
