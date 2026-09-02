import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema({
    firstName: {
        type: String,
        required: [true, 'First name is mandatory'],
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [20, 'First name must be less than 20 characters']
      },
      lastName: {
        type: String,
        required: [true, 'Last name is mandatory'],
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [20, 'Last name must be less than 20 characters']
      },
    email: {
      type: String,
      required: [true, 'Email is mandatory'],
      unique: true, 
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is mandatory'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    profilePicture: {
      type: String,
      default: ''
    //   default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLEbvtpxDZxzv9A4IyPBJTg1OWcX0w7Sp1spex14xeXNOmLlt_vyUR7DU&s=10"
    },
    company: { type: String, default: '' }, // company name
    jobTitle: { type: String, default: '' }, // job title
    techStack: [{ type: String }], // tech stack
    yearsOfExperience: {
        type: Number,
        default: 0,
        min: [0, 'Years of experience cannot be negative']
      },
    githubUrl: { type: String, default: '' }, // github url
    linkedinUrl: { type: String, default: '' }, // linkedin url
    phone: { type: String, default: '' }, 

        // User roles 
        roles: [ { type: String, enum: ["admin", "mentor", "mentee"], }, ], 
        // Mentor profile:
         mentorProfile: { isActive: { type: Boolean, default: true, }, 
         bio: { type: String, trim: true, }, 
         topics: [String], 
         maxSessions: { type: Number, default: 0, min: [0, "Max sessions cannot be negative"], max: [10, "Max sessions cannot be more than 10"], }, 
         sessionLengthMinutes: { type: Number, default: 45, enum: [45, 60, 90], }, },
         
         menteeProfile: {
            isActive: {
              type: Boolean,
              default: true,
            },
          
            learningGoals: {
              type: String,
              trim: true,
            },
          },
          
          }, 
          
          { timestamps: true } 
          );

  // Hash password before saving 
  userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
  });
   
    // Compare password 
    userSchema.methods.comparePassword = async function (candidatePassword) 
    { return bcrypt.compare(candidatePassword, this.password); }; 
    
    export default mongoose.model("user", userSchema);

  