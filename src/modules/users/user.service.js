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
import {
  block_otp_key,
  deleteKey,
  get,
  keys,
  max_otp_key,
  otp_key,
  setValue,
  revoked_key,
  ttlTimer,
  incr,
  block_password_key,
  max_password_key,
} from "../../DB/redis/redis.service.js";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
import { sendOtp } from "../../common/utils/email/otp.resend.js";
import { emailTemplate } from "../../common/utils/email/email.template.js";
import { eventEmitter } from "../../common/utils/email/email.event.js";
//

export const signUp = async (req, res, next) => {
  let uploadedFiles = [];

  try {
    const { userName, email, password, gender, phone, role } = req.body;

    if (await db_service.findOne({ model: userModel, filter: { email } })) {
      throw new Error("Email already exists");
    }

    const newImages = req.files?.attachments?.length || 0;

    // if (newImages !== 2) {
    //   throw new Error("Cover pictures must be exactly 2");
    // }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.attachment[0].path,
      { folder: "sara7a_app/profilePicture" },
    );

    // uploadedFiles.push(public_id);

    // let uploadedFiles = [];
    let arr_paths = [];
    for (const file of req.files.attachments) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: "sara7a_app/coverPicture" },
      );

      arr_paths.push({ secure_url, public_id });
      // uploadedFiles.push(public_id);
    }

    const user = await db_service.create({
      model: userModel,
      data: {
        userName,
        email,
        password: Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
        gender,
        // phone: encryptAsymmetric(phone),
        phone: encrypt(phone),
        role,

        profilePicture: { secure_url, public_id },
        coverPicture: arr_paths,
      },
    });

    const otp = await generateOTP();

    eventEmitter.emit("confirmEmail", async () => {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Sara7a App",
        html: emailTemplate(user.firstName, otp),
      });

      const type = "signupOtp";
      await setValue({
        key: otp_key({ email, type }),
        value: Hash({ plainText: `${otp}` }),
        ttl: 60 * 4,
      });

      await setValue({
        key: max_otp_key({ email, type }),
        value: 1,
        ttl: 60 * 4,
      });
    });

    const userResponse = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      gender: user.gender,
      profilePicture: user.profilePicture,
      coverPicture: user.coverPicture,
      createdAt: user.createdAt,
    };

    successResponse({ res, status: 201, data: userResponse });
  } catch (err) {
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
export const confirmedEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const otpExist = await get(otp_key({ email, type: "signupOtp" }));
  if (!otpExist) {
    throw new Error("otp exired or incorrect");
  }
  if (!Compare({ plainText: otp, cipherText: otpExist })) {
    throw new Error("Invalid otp");
  }
  const isConfirmed = req.user.confirmed;
  if (isConfirmed) {
    throw new Error("Account already confirmed");
  }
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: false,
      provider: providerEnum.system,
    },
    update: { confirmed: true },
  });
  if (!user) {
    throw new Error("user not exist");
  }
  await deleteKey(otp_key({ email }));
  successResponse({
    res,
    message: "confirmed done",
  });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: providerEnum.system,
    },
  });
  if (!user || user.confirmed) {
    throw new Error("user not exist or already confirmed");
  }

  await sendOtp({
    email,
    userName: user.userName,
    message: "welcome to saraha app your otp is",
    type: "signupOtp",
  });
  // await deleteKey(otp_key({ email }));
  // await deleteKey(max_otp_key({ email }));
  // await deleteKey(block_otp_key({ email }));
  successResponse({ res, message: "OTP resent successfully" });
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
  const { email, password, otp } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    throw new Error("Invalid Email");
  }

  const blockedTime = await ttlTimer(block_password_key({ email }));

  if (blockedTime > 0) {
    throw new Error(
      `you have executed the maximum number of tries , please try again after ${blockedTime} seconds`,
    );
  }

  if (!Compare({ plainText: password, cipherText: user.password })) {
    let maxPass = Number(await get(max_password_key({ email }))) || 0;

    if (maxPass >= 5) {
      await setValue({
        key: block_password_key({ email }),
        value: 1,
        ttl: 60 * 5,
      });

      throw new Error("you have executed the maximum number of tries");
    }

    await setValue({
      key: max_password_key({ email }),
      value: maxPass + 1,
      ttl: 60 * 5,
    });

    throw new Error("Invalid password", { cause: 400 });
  }
  await deleteKey(max_password_key({ email }));
  await deleteKey(block_password_key({ email }));

  const jwtid = randomUUID();

  if (!user.twoStepVerification) {
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
  } else {
    if (!otp) {
      throw new Error("OTP are required for 2-step verification");
    }
    const type = "confirm-login";

    const storedOtpHash = await get(otp_key({ email, type }));
    if (!storedOtpHash) {
      throw new Error("OTP expired or invalid");
    }

    if (!Compare({ plainText: otp, cipherText: storedOtpHash })) {
      throw new Error("Invalid OTP");
    }
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
    await deleteKey(otp_key({ email, type }));
    await deleteKey(max_otp_key({ email, type }));
    successResponse({
      res,
      message: "success login",
      data: { ...user._doc, access_token, refresh_token },
    });
  }
};

export const send_2stepVerification_otp = async (req, res, next) => {
  const { emaill } = req.body;

  if (req.user.email != emaill) {
    throw new Error("User not found");
  }
  if (req.user.twoStepVerification) {
    throw new Error("2-step verification already enabled");
  }

  const email = req.user.email;
  const userName = req.user.userName;

  const type = "enable-2SV";
  await sendOtp({
    email,
    userName,
    message: "Your OTP to enable 2-step-verification is: ",
    type,
  });

  successResponse({ res, message: "OTP sent successfully" });
};

export const confirmTwoStepVerification = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new Error("Email or OTP are required");
    }
    const type = "enable-2SV";

    const storedOtpHash = await get(otp_key({ email, type }));

    if (!storedOtpHash) {
      throw new Error("OTP expired or invalid");
    }

    if (!Compare({ plainText: otp, cipherText: storedOtpHash })) {
      throw new Error("Invalid OTP");
    }

    const user = await db_service.findOneAndUpdate({
      model: userModel,
      filter: { email, twoStepVerification: { $ne: true } },
      update: { twoStepVerification: true },
    });

    if (!user) {
      throw new Error("User not found or  2-step already enabled");
    }

    await deleteKey(otp_key({ email }));
    await deleteKey(max_otp_key({ email }));

    successResponse({
      res,
      message: "2-step-verification enable",
    });
  } catch (err) {
    next(err);
  }
};

export const sendLoginOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (!user.twoStepVerification) {
    throw new Error("2-step verification not enabled");
  }

  // const email = req.user.email;
  // const userName = user.userName;

  const type = "confirm-login";
  await sendOtp({
    email,
    userName: user.userName,
    message: "Your OTP to confirm login is: ",
    type,
  });

  successResponse({ res, message: "OTP sent successfully" });
};

export const getProfile = async (req, res, next) => {
  const key = `profile::${req.user._id}`;
  const userExist = await get(key);
  if (userExist) {
    return successResponse({ res, data: userExist });
  }
  await setValue({ key, value: req.user, ttl: 60 });

  successResponse({
    res,
    message: "done",
    data: req.user,
  });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: id },
    update: { $inc: { visitCount: 1 } },
    options: { returnDocument: "after" },
  });

  if (!user) {
    throw new Error("user not found");
  }
  // const updatedUser
  // await user.save();
  // user.phone = decryptAsymmetric(user.phone);
  user.phone = decrypt(user.phone);

  const userResponse = {
    _id: user._id,
    userName: user.userName,
    email: user.email,
    gender: user.gender,
    phone: user.phone,
    profilePicture: user.profilePicture,
    coverPicture: user.coverPicture,
    createdAt: user.createdAt,
  };
  successResponse({
    res,
    message: "done",
    data: userResponse,
  });
};

export const updateProfile = async (req, res, next) => {
  let profilePicture;
  let arr_paths = [];
  let uploadedFiles = [];

  try {
    let { firstName, lastName, gender, phone } = req.body;

    if (phone) {
      phone = encrypt(phone);
    }

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
    if (req.files?.attachments && req.files.attachments.length !== 2) {
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

    const updatedUser = await db_service.findOneAndUpdate({
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
    });
    await deleteKey(`profile::${req.user._id}`);
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
  req.user.changeCredential = new Date();
  await req.user.save();
  successResponse({
    res,
    message: "done",
  });
};

export const sendForgetOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) throw new Error("User not found");
  const type = "forgetPassword";
  await sendOtp({
    email,
    userName: user.userName,
    message: "to reset password is",
    type,
  });
  // await deleteKey(otp_key({ email, type }));
  // await deleteKey(max_otp_key({ email, type }));
  // await deleteKey(block_otp_key({ email, type }));
  successResponse({ res, message: "OTP sent successfully" });
};

export const forgetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw new Error("Email, OTP, and new password are required");
    }
    const type = "forgetPassword";
    const storedOtpHash = await get(otp_key({ email, type }));
    if (!storedOtpHash) {
      throw new Error("OTP expired or invalid");
    }

    if (!Compare({ plainText: otp, cipherText: storedOtpHash })) {
      throw new Error("Invalid OTP");
    }

    const hash = Hash({ plainText: newPassword });

    const user = await db_service.findOneAndUpdate({
      model: userModel,
      filter: { email },
      update: { password: hash, changeCredential: new Date() },
    });

    if (!user) throw new Error("User not found");

    await deleteKey(otp_key({ email }));
    await deleteKey(max_otp_key({ email, type }));

    successResponse({
      res,
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const sendForgetPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await db_service.findOne({
      model: userModel,
      filter: { email },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const jwtid = randomUUID();

    const token = GenerateToken({
      payload: { id: user._id, email: user.email },
      secret_key: SECRET_KEY,
      options: { expiresIn: 60 * 20, jwtid },
    });

    const resetLink = `http://16.171.130.107/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: `Click this link to reset your password: ${resetLink}`,
    });
    //     await sendEmail({
    //   to: user.email,
    //   subject: "Welcome to Sara7a App",
    //   html: emailTemplate(user.firstName, otp),
    // });

    res.status(200).json({
      message: "Forget password link sent successfully",
      resetLink,
    });
  } catch (error) {
    console.error("Error in sendForgetPasswordLink:", error);
    next(error);
  }
};

export const removeProfilePicture = async (req, res, next) => {
  try {
    // const user = await db_service.findOne({
    //   model: userModel,
    //   filter: { _id: req.user._id },
    // });
    // if (!user) throw new Error("User not found");

    const user = req.user;

    if (!user) {
      throw new Error("User not found");
    }
    if (!user.profilePicture || !user.profilePicture.public_id) {
      throw new Error("there is no images to delete");
    }
    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);

      // fs.unlink(user.profilePicture?.path, (err) => {
      //   if (err) console.log("Error deleting local file:", err);
      //});
    }
    user.profilePicture = null;
    await user.save();

    successResponse({ res, message: "Profile image removed successfully" });
  } catch (error) {
    // console.log(req.user.email);
    console.log("error in delete profile picture", error);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { flag } = req.query;

    if (flag === "all") {
      req.user.changeCredential = new Date();
      await req.user.save();

      const pattern = `revoked::${req.user._id}::*`;
      const userKeys = await keys(pattern);

      if (userKeys.length) {
        await db_service.deleteMany(userKeys);
      }
    } else {
      const ttl = req.decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) {
        return next(new Error("Token already expired"));
      }

      await setValue({
        key: revoked_key({
          userId: req.user._id,
          jti: req.decoded.jti,
        }),
        value: req.decoded.jti,
        ttl,
      });
    }
    successResponse({ res, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
