import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    messageKey: { type: String, required: true },
    messageParams: { type: Schema.Types.Mixed, default: {} },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "meeting",
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("notification", notificationSchema);
