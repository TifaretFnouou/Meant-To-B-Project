import mongoose, { Schema } from "mongoose";

/**
 * One document per mentor: open calendar slots mentees can book.
 * Mentors replace/update slots over time (typically per week in the UI).
 */
const availabilitySchema = new Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    slots: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("availability", availabilitySchema);
