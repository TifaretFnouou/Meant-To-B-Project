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
    // final time chosen by the mentee
    scheduledTime: {
      startTime: { type: Date },
      endTime: { type: Date },
    },
    // shared video link — created when the meeting becomes MATCHED
    meetLink: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "PENDING_MENTOR_TIMES", // pending mentor times
        "PENDING_MENTEE_SELECTION", // pending mentee selection
        "PENDING_MENTOR_APPROVAL", // mentee booked a slot; awaiting mentor confirm
        "MATCHED", // matched
        "ATTENDANCE_CONFIRMED", // attendance confirmed
        "COMPLETED", // completed
        "CANCELLED", // cancelled - one of the participants cancelled the meeting
        "NO_SHOW", // no show - one of the participants did not show up for the meeting without cancelling
        "FEEDBACK_FILLED" // feedback filled - both participants have filled out the feedback - isFilled is true in both menteeFeedback and mentorFeedback
      ],
      default: "PENDING_MENTOR_TIMES",
    },
    // post-meeting attendance reports: null = not reported yet, true/false = happened / didn't
    menteeConfirmedAttendance: { type: Boolean, default: null },
    mentorConfirmedAttendance: { type: Boolean, default: null },
    // thank-you / did-not-happen emails sent once after outcome is known
    postMeetingOutcomeNotifiedAt: {
      type: Date,
      default: null,
    },
    
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
    
    // mentee asked for different proposed slots during selection (max 1)
    moreSlotsCount: {
      type: Number,
      default: 0,
    },
    // matched meeting marked unavailable / reschedule (max 1, then cancel)
    rescheduleCount: {
      type: Number,
      default: 0,
    },
    // email/in-app reminder ~30 minutes before start (sent once per scheduled time)
    reminder30mSentAt: {
      type: Date,
      default: null,
    },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("meeting", meetingSchema);