import User from "../models/user.js";

const MAX_RESULTS = 5;
const MAX_CRITERIA = 10;
const MAX_TERM_LENGTH = 60;
const MAX_EXPERIENCE = 80;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TOPIC_STOPWORDS = new Set(["and", "the", "for", "with", "your", "how"]);

const cleanValues = (values) =>
  (Array.isArray(values) ? values : [])
    .filter((value) => typeof value === "string" && value.trim())
    .slice(0, MAX_CRITERIA)
    .map((value) => value.trim().slice(0, MAX_TERM_LENGTH));

// טכנולוגיות נבדקות בהתאמה מדויקת, אחרת חיפוש "Java" היה תופס גם "JavaScript"
const toExactRegexList = (values) =>
  cleanValues(values).map((value) => new RegExp(`^${escapeRegex(value.trim())}$`, "i"));

// נושאי ייעוץ מנוסחים חופשי, ולכן מפרקים למילים: "Interview Preparation" יתפוס גם "Job Interviews"
const toWordRegexList = (values) => {
  const words = new Set(
    cleanValues(values)
      .flatMap((value) => value.toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .filter((word) => word.length >= 3 && !TOPIC_STOPWORDS.has(word))
  );

  return [...words].map((word) => new RegExp(escapeRegex(word), "i"));
};

const safeSocialUrl = (rawUrl, domain) => {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;

  try {
    const value = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (hostname !== domain && !hostname.endsWith(`.${domain}`))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

const safeImageUrl = (rawUrl) => {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const cleanText = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const cleanList = (values) =>
  [...new Set((Array.isArray(values) ? values : []).map((value) => cleanText(value, 50)).filter(Boolean))]
    .slice(0, 12);

// מחזירים ל-AI ולכרטיס רק שדות ציבוריים — לא מייל, טלפון או סיסמה
const toPublicMentor = (user) => ({
  id: user._id.toString(),
  firstName: cleanText(user.firstName, 40),
  lastName: cleanText(user.lastName, 40),
  name: [cleanText(user.firstName, 40), cleanText(user.lastName, 40)].filter(Boolean).join(" "),
  jobTitle: cleanText(user.jobTitle, 100) || null,
  company: cleanText(user.company, 100) || null,
  profilePicture: safeImageUrl(user.profilePicture),
  yearsOfExperience: user.yearsOfExperience ?? 0,
  techStack: cleanList(user.techStack),
  adviceTopics: cleanList(user.mentorProfile?.topics),
  bio: cleanText(user.mentorProfile?.bio, 500) || null,
  linkedinUrl: safeSocialUrl(user.linkedinUrl, "linkedin.com"),
  githubUrl: safeSocialUrl(user.githubUrl, "github.com"),
});

export async function findMentorsByCriteria({ techStack, adviceTopic, minExperience } = {}) {
  const query = {
    roles: "mentor",
    "mentorProfile.isActive": { $ne: false },
  };

  const techRegexes = toExactRegexList(techStack);
  if (techRegexes.length > 0) {
    query.techStack = { $in: techRegexes };
  }

  const topicRegexes = toWordRegexList(adviceTopic);
  if (topicRegexes.length > 0) {
    query["mentorProfile.topics"] = { $in: topicRegexes };
  }

  const experience = minExperience;
  if (
    typeof experience === "number" &&
    Number.isFinite(experience) &&
    experience >= 0 &&
    experience <= MAX_EXPERIENCE
  ) {
    query.yearsOfExperience = { $gte: experience };
  }

  const mentors = await User.find(query)
    .select(
      "firstName lastName jobTitle company profilePicture yearsOfExperience techStack mentorProfile.topics mentorProfile.bio linkedinUrl githubUrl"
    )
    .sort({ yearsOfExperience: -1 })
    .limit(MAX_RESULTS)
    .maxTimeMS(5_000)
    .lean();

  return {
    totalFound: mentors.length,
    mentors: mentors.map(toPublicMentor),
  };
}
