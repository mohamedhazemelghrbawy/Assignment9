import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 2,
    },
    attachments: [String],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

const messageModel = mongoose.model("message", messageSchema);

export default messageModel;
