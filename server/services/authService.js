import UserModel from "../models/user.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { uploadProfileImage } from "../config/cloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET;

function parseList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item) => parseList(item)).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
      if (parsed != null) return [String(parsed).trim()].filter(Boolean);
    } catch {
      // fall through
    }
    return trimmed
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return [String(value)].filter(Boolean);
}

function signToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

export function sanitizeUser(user) {
  if (!user) return null;
  if (typeof user.toSafeObject === "function") {
    return user.toSafeObject();
  }
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  obj.id = String(obj._id || obj.id);
  return obj;
}

// export async function registerUser(body, file) {
//   const email = String(body.email || "")
//     .trim()
//     .toLowerCase();

//   if (!email) {
//     throw Object.assign(new Error("Email is required"), { status: 400 });
//   }

//   const existingEmail = await UserModel.findOne({ email });
//   if (existingEmail) {
//     throw Object.assign(new Error("Email already registered"), { status: 400 });
//   }

//   let roles = parseList(body.roles);
//   if (roles.length === 0) {
//     roles = ["mentee"];
//   }
//   if (roles.some((role) => !["mentor", "mentee"].includes(role))) {
//     throw Object.assign(
//       new Error("Roles must be mentor, mentee, or both"),
//       { status: 400 }
//     );
//   }

//   let profilePicture = "";
//   if (file) {
//     profilePicture = await uploadProfileImage(file);
//   }

//   const menteeGoals =
//     body.menteeGoals ||
//     body.menteeGoals ||
//     body?.menteeProfile?.menteeGoals ||
//     "";

//   const newUser = new UserModel({
//     firstName: body.firstName,
//     lastName: body.lastName,
//     email,
//     password: body.password,
//     profilePicture,
//     company: body.company || "",
//     jobTitle: body.jobTitle || "",
//     techStack: parseList(body.techStack),
//     yearsOfExperience: Number(body.yearsOfExperience) || 0,
//     githubUrl: body.githubUrl || "",
//     linkedinUrl: body.linkedinUrl || "",
//     phone: body.phone || "",
//     roles,
//     menteeProfile: {
//       isActive: true,
//       menteeGoals: menteeGoals,
//     },
//   });

//   await newUser.save();
//   const token = signToken(newUser);

//   return {
//     user: sanitizeUser(newUser),
//     token,
//   };
// }


export async function registerUser(body, file) {
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw Object.assign(new Error("Email is required"), { status: 400 });
  }

  const existingEmail = await UserModel.findOne({ email });
  if (existingEmail) {
    throw Object.assign(new Error("Email already registered"), { status: 400 });
  }

  const isMentor = body.isMentor === 'true' || body.isMentor === true;
  
  let roles = ["mentee"];
  if (isMentor) {
    roles.push("mentor");
  }

  let profilePicture = "";
  if (file) {
    profilePicture = await uploadProfileImage(file);
  }

  const menteeGoals =
    body.menteeGoals ||
    body?.menteeProfile?.menteeGoals ||
    "";

// mentor profile data
    let mentorProfileData = undefined;
  if (isMentor) {
    let parsedMentorProfile = body.mentorProfile || {};
    if (typeof parsedMentorProfile === 'string') {
      try {
        parsedMentorProfile = JSON.parse(parsedMentorProfile);
      } catch (e) {
        parsedMentorProfile = {};
      }
    }
    
    mentorProfileData = {
      isActive: true, 
      bio: parsedMentorProfile.bio || "",
      topics: parseList(parsedMentorProfile.topics) || [],
      maxMeetings: Number(parsedMentorProfile.maxMeetings) || 0,
      meetingLengthMinutes: Number(parsedMentorProfile.meetingLengthMinutes) || 45,
    };
  }

  const newUser = new UserModel({
    firstName: body.firstName,
    lastName: body.lastName,
    email,
    password: body.password,
    profilePicture,
    company: body.company || "",
    jobTitle: body.jobTitle || "",
    techStack: parseList(body.techStack),
    yearsOfExperience: Number(body.yearsOfExperience) || 0,
    githubUrl: body.githubUrl || "",
    linkedinUrl: body.linkedinUrl || "",
    phone: body.phone || "",
    roles,
    menteeProfile: {
      isActive: true,
      menteeGoals: menteeGoals,
    },
    // mentor profile data
    mentorProfile: mentorProfileData,
  });

  await newUser.save();
  const token = signToken(newUser);

  return {
    user: sanitizeUser(newUser),
    token,
  };
}

export async function loginUser(body) {
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw Object.assign(new Error("Email is required"), {
      status: 400,
    });
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 400 });
  }

  if (!user.password) {
    throw Object.assign(
      new Error("This account uses Google sign-in. Please continue with Google."),
      { status: 400 }
    );
  }

  const passwordCheck = await user.comparePassword(body.password);
  if (!passwordCheck) {
    throw Object.assign(new Error("Invalid password, please try again"), {
      status: 400,
    });
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

function normalizeGoogleName(value, fallback) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  if (cleaned.length >= 2) return cleaned.slice(0, 20);
  return fallback;
}

async function upsertGoogleUser(payload) {
  if (!payload?.email || !payload.sub) {
    throw Object.assign(new Error("Google account is missing required profile data"), {
      status: 400,
    });
  }

  if (payload.email_verified === false) {
    throw Object.assign(new Error("Google email is not verified"), { status: 400 });
  }

  const email = String(payload.email).trim().toLowerCase();
  const googleId = String(payload.sub);
  const emailLocal = email.split("@")[0] || "user";

  let user = await UserModel.findOne({
    $or: [{ googleId }, { email }],
  });

  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      throw Object.assign(new Error("Email is already linked to another Google account"), {
        status: 409,
      });
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.profilePicture && payload.picture) {
      user.profilePicture = payload.picture;
    }

    await user.save();
  } else {
    user = new UserModel({
      firstName: normalizeGoogleName(payload.given_name, normalizeGoogleName(emailLocal, "User")),
      lastName: normalizeGoogleName(
        payload.family_name,
        normalizeGoogleName(payload.name?.split(" ").slice(-1)[0], "Google")
      ),
      email,
      googleId,
      profilePicture: payload.picture || "",
      roles: ["mentee"],
      menteeProfile: {
        isActive: true,
        menteeGoals: "",
      },
    });
    await user.save();
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user),
  };
}

/** Google Identity Services — verify ID token and upsert user. */
export async function loginWithGoogle(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw Object.assign(new Error("Google sign-in is not configured"), {
      status: 503,
    });
  }

  if (!idToken || typeof idToken !== "string") {
    throw Object.assign(new Error("Google credential is required"), { status: 400 });
  }

  const client = new OAuth2Client(clientId);
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error("Invalid Google credential"), { status: 401 });
  }

  return upsertGoogleUser(payload);
}

export function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw Object.assign(new Error("Access denied. No token provided"), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw Object.assign(new Error("Access denied. Invalid token"), {
      status: 401,
    });
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw Object.assign(new Error("Invalid token"), { status: 401 });
  }
}
