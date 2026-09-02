

import UserModel from "../models/user.js";

// Update user info
export const updateUser = async (userId, updateData) => {
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
  ];

  const filteredData = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  return await UserModel.findByIdAndUpdate(
    userId,
    { $set: filteredData },
    {
      new: true,
      runValidators: true,
    }
  );
};

// Update profile picture
export const updateProfilePicture = async (userId, newProfilePicture) => {
  return await UserModel.findByIdAndUpdate(
    userId,
    { $set: { profilePicture: newProfilePicture } },
    {
      new: true,
      runValidators: true,
    }
  );
};

// Delete user
export const deleteUser = async (userId) => {
  await UserModel.findByIdAndDelete(userId);
};

// Get user by ID
export const getUser = async (userId) => {
  return await UserModel.findById(userId);
};

// Get all users - Admin use
export const getAllUsers = async () => {
  const users = await UserModel.find({}, { password: 0 }).lean();
  return users;
};