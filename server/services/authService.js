// import UserModel from "../models/user.js";
// // import { cloudinary } from "../src/config/cloudinary.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET;

// // Register User
// export const registerUser = async (body, file) => {
//     const existingUser = await UserModel.findOne({ email: body.email });
//     if (existingUser) throw new Error("Email already registered");

//     let profileImageUrl = body.profilePicture || "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=";

//     if (file) {
//         profileImageUrl = file.path;
//     }

//     const newUser = new UserModel({
//         username: body.username,
//         email: body.email,
//         password: body.password,
//         firstName: body.firstName,
//         lastName: body.lastName,
//         gender: body.gender,
//         profilePicture: profileImageUrl,
//         country: body.country,
//         city: body.city,
//     });

//     await newUser.save();
//     return newUser;
// };


// // Login User
// export const loginUser = async (body) => {
//     const user = await UserModel.findOne({ email: body.email });
//     if (!user) throw new Error("User not found");

//     const passwordCheck = await user.comparePassword(body.password);
//     if (!passwordCheck) throw new Error("Invalid password, please try again");

//     // Generate JWT Token
//     const token = jwt.sign(
//         { id: user._id, username: user.username, isAdmin: user.isAdmin },
//         JWT_SECRET,
//         { expiresIn: "1d" }
//     );

//     return { user, token };
// };

// // Verify JWT Token (to be used in controllers)
// export const verifyToken = (req) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) throw new Error("Access denied. No token provided");

//     const token = authHeader.split(" ")[1];
//     if (!token) throw new Error("Access denied. Invalid token");

//     try {
//         return jwt.verify(token, JWT_SECRET);
//     } catch (err) {
//         throw new Error("Invalid token");
//     }
// };


import UserModel from "../models/user.js";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Register User
export const registerUser = async (body, file) => {
  const existingUser = await UserModel.findOne({
    email: body.email,
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Validate roles
  const roles = Array.isArray(body.roles) ? body.roles : [body.roles];
  if (roles.length === 0 || roles.some((role) => !["mentor", "mentee"].includes(role))) {
    throw new Error("Roles must be mentor, mentee, or both");
  }

  let profileImageUrl = body.profilePicture || "";

  if (file) {
    profileImageUrl = file.path;
  }

  const newUser = new UserModel({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    password: body.password,
    profilePicture: profileImageUrl,
    company: body.company || "",
    jobTitle: body.jobTitle || "",
    techStack: body.techStack || [],
    yearsOfExperience: body.yearsOfExperience || 0,
    githubUrl: body.githubUrl || "",
    linkedinUrl: body.linkedinUrl || "",
    phone: body.phone || "",
    roles
  });

  await newUser.save();

  return newUser;
};

// Login User
export const loginUser = async (body) => {
  const user = await UserModel.findOne({
    email: body.email,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordCheck = await user.comparePassword(body.password);

  if (!passwordCheck) {
    throw new Error("Invalid password, please try again");
  }

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      roles: user.roles,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    user,
    token,
  };
};

// Verify JWT Token
export const verifyToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error("Access denied. No token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new Error("Access denied. Invalid token");
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid token");
  }
};