import { redisClient } from "./redis.db.js";
export const revoked_key = ({ userId, jti }) => {
  return `revoke_token::${userId}::${jti}`;
};
export const get_key = ({ userId }) => {
  return `revoke_token::${userId}`;
};
export const otp_key = ({ email, type } = {}) => {
  return `${type}::${email}`;
};
export const max_otp_key = ({ email, type } = {}) => {
  return `${type}::${email}::max_tries`;
};
export const block_otp_key = ({ email, type } = {}) => {
  return `${type}::${email}::block`;
};
export const max_password_key = ({ email }) => {
  return `password::${email}::max_tries`;
};
export const block_password_key = ({ email }) => {
  return `password::${email}::block`;
};

export const setValue = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log("error to set data in redis", error);
  }
};

export const update = async ({ key, value } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    return await redisClient.set(key, data);
  } catch (error) {
    console.log("error to update data in redis", error);
  }
};

export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log("error to get data in redis", error);
  }
};

export const ttlTimer = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("error to get ttl data in redis", error);
  }
};
export const expire = async (key) => {
  try {
    return await redisClient.expire(key);
  } catch (error) {
    console.log("error to get expire data in redis", error);
  }
};

export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("error to exist data in redis", error);
  }
};

export const deleteKey = async (key) => {
  try {
    if (!key.length) return 0;
    return await redisClient.del(key);
  } catch (error) {
    console.log("error to delete data in redis", error);
  }
};

export const keys = async (pattern = "*") => {
  try {
    return await redisClient.keys(`${pattern}`);
  } catch (error) {
    console.log("error to get keys from redis", error);
  }
};

export const incr = async (key) => {
  try {
    if (!key.length) return 0;
    return await redisClient.incr(key);
  } catch (error) {
    console.log("error to increment operation", error);
  }
};
