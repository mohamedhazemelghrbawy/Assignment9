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
} from "../../../DB/redis/redis.service.js";
import { Hash } from "../security/hash.security.js";

import { generateOTP, sendEmail } from "./send.email.js";

export const sendOtp = async ({ email, userName, message, type }) => {
  const isBlocked = await ttlTimer(block_otp_key({ email, type }));
  if (isBlocked > 0) {
    throw new Error(
      `you have executed the maximum number of tries , please try again after ${isBlocked} seconds `,
    );
  }

  const ttl = await ttlTimer(otp_key({ email, type }));
  if (ttl > 0) {
    throw new Error(`you can resend otp after ${ttl} seconds`);
  }

  let maxOtp = await get(max_otp_key({ email, type }));
  if (maxOtp >= 3) {
    await setValue({
      key: block_otp_key({ email, type }),
      value: 1,
      ttl: 60 * 5,
    });

    await setValue({
      key: max_otp_key({ email, type }),
      value: 0,
      ttl: 60 * 5,
    });

    throw new Error("you have executed the maximum number of tries");
  }

  const otp = await generateOTP();
  await sendEmail(
    email,
    "welcome to saraha app",
    `<h1>Hello ${userName}</h1>
   <p>${message}: ${otp}</p>`,
  );

  await setValue({
    key: otp_key({ email, type }),
    value: Hash({ plainText: `${otp}` }),
    ttl: 60,
  });

  await incr(max_otp_key({ email, type }));

  return otp;
};
