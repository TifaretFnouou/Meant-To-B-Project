import UserModel from "../models/user.js";
import { sanitizeUser } from "./authService.js";
import { uploadProfileImage } from "../config/cloudinary.js";

function parseList(value) {
  if (value == null || value === "") return undefined;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // fall through
    }
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value].filter(Boolean);
}

export async function updateUser(userId, updateData, actor = {}) {
  const allowedFields = [
    "firstName",
    "lastName",
    "company",
    "jobTitle",
    "techStack",
    "yearsOfExperience",
    "githubUrl",
    "linkedinUrl",
    "phone",
    "mentorProfile",
    "menteeProfile",
    "roles",
  ];

  const filteredData = {};

  for (const field of allowedFields) {
    if (updateData[field] === undefined) continue;

    if (field === "techStack") {
      filteredData.techStack = parseList(updateData.techStack) || [];
      continue;
    }

    if (field === "yearsOfExperience") {
      filteredData.yearsOfExperience = Number(updateData.yearsOfExperience) || 0;
      continue;
    }

    if (field === "roles") {
      const roles = parseList(updateData.roles) || [];
      if (roles.includes("admin") && !actor.roles?.includes("admin")) {
        throw Object.assign(new Error("Cannot self-assign admin role"), {
          status: 403,
        });
      }
      if (roles.some((role) => !["admin", "mentor", "mentee"].includes(role))) {
        throw Object.assign(new Error("Invalid role value"), { status: 400 });
      }
      filteredData.roles = roles;
      continue;
    }

    filteredData[field] = updateData[field];
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: filteredData },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return sanitizeUser(user);
}

export async function updateProfilePicture(userId, file) {
  if (!file) {
    throw Object.assign(new Error("Profile picture file is required"), {
      status: 400,
    });
  }

  const secureUrl = await uploadProfileImage(file);

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { profilePicture: secureUrl } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return sanitizeUser(user);
}

export async function deleteUser(userId) {
  const user = await UserModel.findByIdAndDelete(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
}

export async function getUser(userId) {
  return UserModel.findById(userId);
}

export async function getAllUsers() {
  const users = await UserModel.find({}, { password: 0 }).lean();
  return users.map((user) => {
    const { password, ...rest } = user;
    return {
      ...rest,
      id: String(user._id),
    };
  });
}
