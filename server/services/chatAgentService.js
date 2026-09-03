import UserModel from "../models/user.js";

const PUBLIC_MENTOR_PROJECTION = {
  password: 0,
  phone: 0,
  email: 0,
  linkedinUrl: 0,
  githubUrl: 0,
  __v: 0,
};

function sanitizeMentor(mentor) {
  return {
    id: mentor._id?.toString?.() || mentor.id,
    firstName: mentor.firstName || "",
    lastName: mentor.lastName || "",
    fullName: `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim(),
    company: mentor.company || "",
    jobTitle: mentor.jobTitle || "",
    yearsOfExperience: mentor.yearsOfExperience || 0,
    techStack: Array.isArray(mentor.techStack) ? mentor.techStack : [],
    topics: Array.isArray(mentor?.mentorProfile?.topics) ? mentor.mentorProfile.topics : [],
    isActive: Boolean(mentor?.mentorProfile?.isActive),
    bio: mentor?.mentorProfile?.bio || "",
    maxSessions: mentor?.mentorProfile?.maxSessions ?? 0,
    sessionLengthMinutes: mentor?.mentorProfile?.sessionLengthMinutes ?? 45,
    profilePicture: mentor.profilePicture || "",
  };
}

export async function getMentorsByTech(tech) {
  if (!tech || typeof tech !== "string") return [];

  const term = tech.trim();
  if (!term) return [];

  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const mentors = await UserModel.find(
    {
      roles: "mentor",
      $or: [{ techStack: regex }, { "mentorProfile.topics": regex }],
    },
    PUBLIC_MENTOR_PROJECTION
  )
    .limit(20)
    .lean();

  return mentors.map(sanitizeMentor);
}

export async function getActiveMentors() {
  const mentors = await UserModel.find(
    {
      roles: "mentor",
      "mentorProfile.isActive": true,
    },
    PUBLIC_MENTOR_PROJECTION
  )
    .limit(20)
    .lean();

  return mentors.map(sanitizeMentor);
}

export function isMentoringDomainQuestion(message) {
  const text = (message || "").toLowerCase();

  const allowedKeywords = [
    "mentor",
    "mentee",
    "mentoring",
    "session",
    "meeting",
    "calendar",
    "book",
    "appointment",
    "tech",
    "stack",
    "topic",
    "queenb",
    "meant to b",
    "platform",
    "מנטור",
    "מנטורית",
    "מנטית",
    "פגישה",
    "פגישות",
    "יומן",
    "חיפוש",
    "קטלוג",
    "טכנולוג",
    "קהילה",
    "אתר",
  ];

  return allowedKeywords.some((keyword) => text.includes(keyword));
}
