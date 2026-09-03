import "dotenv/config";
import mongoose from "mongoose";
import UserModel from "../models/user.js";

const mongoUri = process.env.MONGO_URI;

const seedUsers = [
  {
    email: "admin@queenb.com",
    password: "Admin123!",
    firstName: "שרה",
    lastName: "כהן",
    roles: ["admin"],
    techStack: ["React", "Node.js"],
    company: "QueenB",
    jobTitle: "Community Admin",
    yearsOfExperience: 8,
  },
  {
    email: "mentor@queenb.com",
    password: "Mentor123!",
    firstName: "דנה",
    lastName: "לוי",
    roles: ["mentor"],
    techStack: ["React", "TypeScript", "Node.js"],
    company: "Wix",
    jobTitle: "Senior Frontend Engineer",
    yearsOfExperience: 7,
    githubUrl: "https://github.com/dana",
    linkedinUrl: "https://linkedin.com/in/dana",
    mentorProfile: {
      isActive: true,
      bio: "מפתחת Frontend עם ניסיון בהנחיית junior developers",
      topics: ["Frontend", "ראיונות עבודה", "React"],
      maxSessions: 3,
      sessionLengthMinutes: 60,
    },
  },
  {
    email: "yael_backend@queenb.com",
    password: "Mentor123!",
    firstName: "יעל",
    lastName: "אברהם",
    roles: ["mentor"],
    techStack: ["Python", "Java", "SQL", "MongoDB"],
    company: "Check Point",
    jobTitle: "Backend Team Lead",
    yearsOfExperience: 12,
    githubUrl: "https://github.com/yael-backend",
    linkedinUrl: "https://linkedin.com/in/yael-a",
    mentorProfile: {
      isActive: true,
      bio: "מובילת צוות Backend — מומחית ב-architecture, microservices וראיונות senior",
      topics: ["Backend", "Full Stack", "Leadership"],
      maxSessions: 2,
      sessionLengthMinutes: 90,
    },
  },
  {
    email: "michal_devops@queenb.com",
    password: "Mentor123!",
    firstName: "מיכל",
    lastName: "פרץ",
    roles: ["mentor"],
    techStack: ["AWS", "Docker", "Go", "Python"],
    company: "Monday.com",
    jobTitle: "DevOps Engineer",
    yearsOfExperience: 8,
    linkedinUrl: "https://linkedin.com/in/michal-devops",
    mentorProfile: {
      isActive: true,
      bio: "DevOps ו-cloud — CI/CD, Kubernetes, וליווי מעבר לתפקידי תשתיות",
      topics: ["DevOps", "Backend", "מעבר קריירה"],
      maxSessions: 4,
      sessionLengthMinutes: 60,
    },
  },
  {
    email: "shira_startup@queenb.com",
    password: "Mentor123!",
    firstName: "שירה",
    lastName: "גבע",
    roles: ["mentor"],
    techStack: ["React", "Node.js", "PostgreSQL"],
    company: "Fiverr",
    jobTitle: "Full Stack Developer",
    yearsOfExperience: 6,
    mentorProfile: {
      isActive: true,
      bio: "מפתחת בסטארטאפ — מנטורינג לכניסה לתעשייה ולבניית מוצר",
      topics: ["Startup", "Full Stack", "קורות חיים"],
      maxSessions: 5,
      sessionLengthMinutes: 45,
    },
  },
  {
    email: "roni_mobile@queenb.com",
    password: "Mentor123!",
    firstName: "רוני",
    lastName: "שמש",
    roles: ["mentor"],
    techStack: ["Swift", "Kotlin", "React Native"],
    company: "Apple",
    jobTitle: "Mobile Engineer",
    yearsOfExperience: 9,
    mentorProfile: {
      isActive: true,
      bio: "פיתוח מובייל וקריירה בחו״ל",
      topics: ["Mobile", "ראיונות עבודה"],
      maxSessions: 2,
      sessionLengthMinutes: 60,
    },
  },
  {
    email: "liat_data@queenb.com",
    password: "Mentor123!",
    firstName: "ליאת",
    lastName: "ברק",
    roles: ["mentor"],
    techStack: ["Python", "SQL", "Spark"],
    company: "Intel",
    jobTitle: "Data Engineer",
    yearsOfExperience: 7,
    mentorProfile: {
      isActive: true,
      bio: "Data engineering ומעבר מפיתוח ל-data",
      topics: ["Data", "Backend", "מעבר קריירה"],
      maxSessions: 6,
      sessionLengthMinutes: 45,
    },
  },
  {
    email: "inactive_mentor@queenb.com",
    password: "Mentor123!",
    firstName: "Inactive",
    lastName: "Mentor",
    roles: ["mentor"],
    techStack: ["Python", "AWS"],
    company: "Old Corp",
    jobTitle: "Architect",
    yearsOfExperience: 10,
    mentorProfile: {
      isActive: false,
      bio: "מנטורית לא פעילה — לא אמורה להופיע בקטלוג",
      topics: ["Backend"],
      maxSessions: 0,
      sessionLengthMinutes: 60,
    },
  },
  {
    email: "mentee@queenb.com",
    password: "Mentee123!",
    firstName: "נועה",
    lastName: "מזרחי",
    roles: ["mentee"],
    techStack: ["JavaScript", "React"],
    jobTitle: "Junior Developer",
    yearsOfExperience: 1,
    menteeProfile: {
      isActive: true,
      MenteeGoals: "להתכונן לראיונות עבודה ולשפר React",
    },
  },
  {
    email: "dual@queenb.com",
    password: "Dual123!",
    firstName: "תמר",
    lastName: "לוי",
    roles: ["mentee", "mentor"],
    techStack: ["TypeScript", "React", "Node.js"],
    company: "TechFlow",
    jobTitle: "Full Stack Developer",
    yearsOfExperience: 5,
    mentorProfile: {
      isActive: true,
      bio: "מפתחת Full Stack עם ניסיון בהנחיית junior developers",
      topics: ["Full Stack", "ראיונות עבודה"],
      maxSessions: 2,
      sessionLengthMinutes: 60,
    },
    menteeProfile: {
      isActive: true,
      MenteeGoals: "ללמוד System Design ולהתקדם לתפקיד Senior",
    },
  },
];

async function seed() {
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  for (const user of seedUsers) {
    const existing = await UserModel.findOne({ email: user.email });
    if (existing) {
      console.log(`Skip existing: ${user.email}`);
      continue;
    }

    await UserModel.create(user);
    console.log(`Created: ${user.email}`);
  }

  console.log("Seed complete");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
