import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import messageModel from "../../DB/models/message.model.js";
import { successResponse } from "../../common/utils/response.success.js";

export const sendMessage = async (req, res, next) => {
  const { content, userId } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: userId },
  });
  if (!user) {
    throw new Error("user not exist");
  }

  let arr = [];
  if (req.files.length) {
    for (const file of req.files) {
      arr.push(file.path);
    }
  }
  const message = await db_service.create({
    model: messageModel,
    data: {
      content,
      userId: user._id,
      attachments: arr,
    },
  });

  successResponse({ res, status: 201, data: message });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;

  const message = await db_service.findById({
    model: messageModel,

    id: messageId,
  });
  if (!message) {
    throw new Error("message not exist or not auth");
  }

  successResponse({ res, status: 200, data: message });
};

export const getMessages = async (req, res, next) => {
  const messages = await db_service.find({
    model: messageModel,
    filter: {
      userId: req.user._id,
      // userId:req.params.userId
    },
  });

  successResponse({ res, status: 200, data: messages });
};
