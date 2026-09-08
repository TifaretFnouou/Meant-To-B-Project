import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is mandatory"],
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [20, "First name must be less than 20 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is mandatory"],
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [20, "Last name must be less than 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is mandatory"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        "Password is mandatory",
      ],
      minlength: [8, "Password must be at least 8 characters"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    company: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    techStack: [{ type: String }],
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, "Years of experience cannot be negative"],
    },
    githubUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    phone: { type: String, default: "" },
    roles: [
      {
        type: String,
        enum: ["admin", "mentor", "mentee"],
        default: "mentee",
      },
    ],
    mentorProfile: {
      isActive: { type: Boolean, default: false },
      bio: { type: String, trim: true },
      topics: [String],
      maxMeetings: {
        type: Number,
        default: 0,
        min: [0, "Max Meetings cannot be negative"],
        max: [10, "Max Meetings cannot be more than 10"],
      },
      meetingLengthMinutes: {
        type: Number,
        default: 45,
        enum: [45, 60, 90],
      },
// for the admin to track the number of meetings completed by the mentor
      completedMeetings: { type: Number, default: 0 },
    },
    menteeProfile: {
      isActive: {
        type: Boolean,
        default: true,
      },
      menteeGoals: {
        type: String,
        trim: true,
      },
      // for the admin to track the number of meetings completed by the mentee
      completedMeetings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: false });
  delete obj.password;
  obj.id = String(obj._id);
  return obj;
};

export default mongoose.model("user", userSchema);
