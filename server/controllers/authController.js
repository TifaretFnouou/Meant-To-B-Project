// import { loginUser, registerUser } from "../services/authService.js";
// import { parser } from "../src/config/cloudinary.js";
// import { verifyToken } from "../services/authService.js";
// import { getUser } from "../services/userService.js";

// // Register Controller
// export const register = async (req, res) => {
//     try {
//         const newUser = await registerUser(req.body, req.file);
//         const { password, ...userData } = newUser._doc;

//         res.status(201).json({
//             message: "User has been registered successfully",
//             user: userData,
//         });
//     } catch (error) {
//         res.status(400).json({
//             message: error.message || "Error occurred registering user",
//         });
//     }
// };

// // Login Controller
// export const login = async (req, res) => {
//     try {
//         const { user, token } = await loginUser(req.body);
//         const { password, ...userData } = user._doc;

//         res.status(200).json({
//             message: "User logged in successfully",
//             user: userData,
//             token,
//         });
//     } catch (error) {
//         res.status(400).json({
//             message: error.message || "Error occurred logging in the user",
//         });
//     }
// };

// // Get current authenticated user
// export const me = async (req, res) => {
//     try {
//         const userData = verifyToken(req);
//         const user = await getUser(userData.id);
//         if (!user) return res.status(404).json({ message: 'User not found' });
//         const { password, ...data } = user._doc;
//         res.status(200).json({ user: data });
//     } catch (error) {
//         res.status(401).json({ message: error.message || 'Unauthorized' });
//     }
// };


import {
    loginUser,
    registerUser,
    verifyToken,
  } from "../services/authService.js";
  
  import { getUser } from "../services/userService.js";
  
  // Register Controller
  export const register = async (req, res) => {
    try {
      const newUser = await registerUser(req.body, req.file);
  
      const { password, ...userData } = newUser._doc;
  
      res.status(201).json({
        message: "User has been registered successfully",
        user: userData,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message || "Error occurred registering user",
      });
    }
  };
  
  // Login Controller
  export const login = async (req, res) => {
    try {
      const { user, token } = await loginUser(req.body);
  
      const { password, ...userData } = user._doc;
  
      res.status(200).json({
        message: "User logged in successfully",
        user: userData,
        token,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message || "Error occurred logging in the user",
      });
    }
  };
  
  // Get current authenticated user
  export const me = async (req, res) => {
    try {
      const userData = verifyToken(req);
  
      const user = await getUser(userData.id);
  
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }
  
      const { password, ...data } = user._doc;
  
      res.status(200).json({
        user: data,
      });
    } catch (error) {
      res.status(401).json({
        message: error.message || "Unauthorized",
      });
    }
  };