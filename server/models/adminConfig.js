import mongoose, { Schema } from "mongoose";

    // "singleton" document for the entire application - stores the list of technologies
    // and advice topics that the admin can manage through Categories & Tags.
    
const adminConfigSchema = new Schema(
  {
    techStack: [{ type: String }],
    adviceTopics: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("adminConfig", adminConfigSchema);