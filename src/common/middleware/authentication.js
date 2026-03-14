import { verifyToken, GenerateToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { PREFIX, SECRET_KEY } from "../../../config/config.service.js";
// import revokeTokenModel from "../../DB/models/revokeToken.model.js";
import { get } from "../../DB/redis/redis.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("token not exist");
  }

  const [prefix, token] = authorization.split(" ");

  console.log(prefix);
  console.log(PREFIX);
  console.log(token);
  console.log(SECRET_KEY);
  if (prefix != PREFIX) {
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

  if (user?.changeCredential?.getTime() > decoded.iat) {
    throw new Error("token expired");
  }

  const revokeToken = await get(
    revoked_key({ userId: decoded.id, jti: decoded.jti }),
  );
  if (revokeToken) {
    throw new Error("inValid token revoked");
  }

  req.user = user;
  req.decoded = decoded;
  next();
};
