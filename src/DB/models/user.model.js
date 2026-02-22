import mongoose from "mongoose";
import {
  roleEnum,
  GenderEnum,
  providerEnum,
} from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == providerEnum.google ? false : true;
      },
      trim: true,
    },

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    provider: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.user,
    },
    phone: {
      type: String,
      require: true,
    },
    profilePicture: String,
    confirmed: {
      type: Boolean,
    },
    role: {
      type: String,
      enum: Object.values(roleEnum),
      default: roleEnum.system,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);
userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (v) {
    const [firstName, lastName] = v.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
  });

const userModel = mongoose.model("user", userSchema);

export default userModel;
