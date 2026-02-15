import { verifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error("token not exist");
  }
  const decoded = verifyToken({
    token: authorization,
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
  req.user = user;
  next();
};
