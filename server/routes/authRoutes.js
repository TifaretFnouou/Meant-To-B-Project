// import express from "express";
// import { login, register } from "../controllers/authController.js";
// // import { parser } from "../src/config/cloudinary.js";
// import { me } from "../controllers/authController.js";

// const router = express.Router();

// // Register new user
// router.post("/register", parser.single("profilePicture"), register);

// // Login existing user
// router.post("/login", login);

// // Current user (requires token)
// router.get('/me', me);

// export default router;


import express from "express";

import {
  login,
  register,
  me,
} from "../controllers/authController.js";

import { parser } from "../src/config/cloudinary.js";

const router = express.Router();

// Register new user
router.post("/register", parser.single("profilePicture"), register);

// Login existing user
router.post("/login", login);

// Current user (requires token)
router.get("/me", me);

export default router;