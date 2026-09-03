import UserModel from "../models/user.js";
import jwt from "jsonwebtoken";
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

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
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

  let roles = parseList(body.roles);
  if (roles.length === 0) {
    roles = ["mentee"];
  }
  if (roles.some((role) => !["mentor", "mentee"].includes(role))) {
    throw Object.assign(
      new Error("Roles must be mentor, mentee, or both"),
      { status: 400 }
    );
  }

  let profilePicture = "";
  if (file) {
    profilePicture = await uploadProfileImage(file);
  } else if (isHttpUrl(body.profilePictureUrl || body.profilePicture)) {
    profilePicture = String(body.profilePictureUrl || body.profilePicture).trim();
  }

  const menteeGoals =
    body.MenteeGoals ||
    body.menteeGoals ||
    body?.menteeProfile?.MenteeGoals ||
    "";

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
      MenteeGoals: menteeGoals,
    },
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
