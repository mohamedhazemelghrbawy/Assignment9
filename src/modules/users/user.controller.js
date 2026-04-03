import { authentication } from "../../common/middleware/authentication.js";
import * as US from "./user.service.js";
import { Router } from "express";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { validation } from "../../common/middleware/validation.js";
import * as UV from "../user.validation.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
import { authorization } from "../../common/middleware/authorization.js";
import messageRouter from "../message/message.controller.js";
const userRouter = Router({ caseSensitive: true, strict: true });

// userRouter.post(
//   "/signup",
//   multer_host(multer_enum.image).single("attachment"),
//   validation(UV.signUpSchema),
//   US.signUp,
// );

// userRouter.post(
//   "/signup",
//   multer_local({
//     custom_path: "users/videos",
//     custom_type: [...multer_enum.image, ...multer_enum.video],
//   }).array("attachments", 3),
//   US.signUp,
// );

userRouter.use("/:userId/messages", messageRouter);

userRouter.post(
  "/signup",
  multer_host([...multer_enum.image]).fields([
    { name: "attachment", maxCount: 1 },
    { name: "attachments", maxCount: 2 },
  ]),
  US.signUp,
);
userRouter.post("/signup/gmail", US.signUpWithGmail); // ❌

userRouter.patch("/confirm-email", authentication, US.confirmedEmail);

userRouter.patch("/resend-otp", authentication, US.resendOtp);

userRouter.patch(
  "/signup/confirm-gmail",
  validation(UV.confirmEmailSchmea),
  US.confirmedEmail,
);

userRouter.post("/login", validation(UV.logInSchema), US.login);

userRouter.get("/profile", authentication, US.getProfile);

userRouter.post("/refresh-token", US.refresh_token);

userRouter.patch(
  "/updateProfile",
  authentication,
  multer_host([...multer_enum.image]).fields([
    { name: "attachment", maxCount: 1 },
    { name: "attachments", maxCount: 2 },
  ]),
  validation(UV.updateProfileSchema),
  US.updateProfile,
);

userRouter.patch(
  "/updatePassword",
  authentication,
  authorization(["user"]),
  validation(UV.updatePasswordSchema),
  US.updatePassword,
);

userRouter.post("/send-forget-password", authentication, US.sendForgetOtp);

userRouter.post("/forget-password", US.forgetPassword);

userRouter.patch("/sendLink-forget-password", US.sendForgetPasswordLink);

userRouter.patch(
  "/send-two-stepVerification-otp",
  authentication,
  US.send_2stepVerification_otp,
);

userRouter.patch(
  "/confirm-two-step-verification",
  authentication,
  US.confirmTwoStepVerification,
);

userRouter.patch("/send-confirmed-login-otp", US.sendLoginOtp);

userRouter.get(
  "/share_profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);
userRouter.post(
  "/removeProfilePicture",
  authentication,
  US.removeProfilePicture,
);

userRouter.post("/logout", authentication, US.logout);

export default userRouter;
