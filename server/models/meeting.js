import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
  {
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
// proposed times by the mentor
    proposedTimes: [
      {
        startTime: { type: Date },
        endTime: { type: Date },
      }
    ],
    // final time chosen by the mentor
    scheduledTime: {
      startTime: { type: Date },
      endTime: { type: Date },
    },
    status: {
      type: String,
      enum: [
        "PENDING_MENTOR_TIMES", // pending mentor times
        "PENDING_MENTEE_SELECTION", // pending mentee selection
        "MATCHED", // matched
        "ATTENDANCE_CONFIRMED", // attendance confirmed
        "COMPLETED", // completed
        "CANCELLED", // cancelled
        "FEEDBACK_FILLED" // feedback filled
      ],
      default: "PENDING_MENTOR_TIMES",
    },
    // approval of attendance before the meeting
    menteeConfirmedAttendance: { type: Boolean, default: false },
    mentorConfirmedAttendance: { type: Boolean, default: false },
    
    // feedback after the meeting
    menteeFeedback: {
      isFilled: { type: Boolean, default: false },
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
    },
    mentorFeedback: {
      isFilled: { type: Boolean, default: false },
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
    },
    
    // counter of how many times they requested times again (to enforce the one iteration limit)
    rescheduleCount: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export default mongoose.model("meeting", meetingSchema);