import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    adviceTopics: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// אינדקסים לשיפור מהירות החיפוש לפי טכנולוגיות, תחומי ייעוץ ושנות ניסיון
mentorSchema.index({ skills: 1 });
mentorSchema.index({ adviceTopics: 1 });
mentorSchema.index({ experienceYears: 1 });

export default mongoose.model("Mentor", mentorSchema);