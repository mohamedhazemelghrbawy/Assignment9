import { authentication } from "../../common/middleware/authentication.js";
import * as US from "./user.service.js";
import { Router } from "express";
const userRouter = Router();
userRouter.post("/signup", US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);

userRouter.post("/login", US.login);

userRouter.get("/profile", authentication, US.getProfile);

export default userRouter;
