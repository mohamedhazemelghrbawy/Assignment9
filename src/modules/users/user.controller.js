import { authentication } from "../../common/middleware/authentication.js";
import * as US from "./user.service.js";
import { Router } from "express";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import * as UV from "../user.validation.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
const userRouter = Router();

userRouter.post(
  "/signup",
  multer_host(multer_enum.image).single("attachment"),
  validation(UV.signUpSchema),
  US.signUp,
);

// userRouter.post(
//   "/signup",
//   multer_local({
//     custom_path: "users/videos",
//     custom_type: [...multer_enum.image, ...multer_enum.video],
//   }).array("attachments", 3),
//   US.signUp,
// );
// userRouter.post(
//   "/signup",
//   multer_local({
//     custom_path: "users/videos",
//     custom_type: [...multer_enum.image, ...multer_enum.video],
//   }).fields([
//     { name: "atachment", maxCount: 1 },
//     { name: "atachments", maxCount: 8 },
//   ]),
//   US.signUp,
// );
userRouter.post("/signup/gmail", US.signUpWithGmail);

userRouter.post("/login", validation(UV.logInSchema), US.login);

userRouter.get("/profile", authentication, US.getProfile);

userRouter.patch(
  "/updateProfile",
  authentication,
  validation(UV.updateProfileSchema),
  US.updateProfile,
);

userRouter.patch(
  "/updatePassword",
  authentication,
  validation(UV.updatePasswordSchema),
  US.updatePassword,
);

userRouter.get(
  "/share_profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);

export default userRouter;
