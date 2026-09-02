
import {
    deleteUser,
    getUser,
    getAllUsers,
    updateProfilePicture,
    updateUser,
  } from "../services/userService.js";
  
  import { verifyToken } from "../services/authService.js";
  
  // Update user
  export const updateUserController = async (req, res) => {
    try {
      const userData = verifyToken(req);
  
      if (
        userData.id === req.params.id ||
        userData.roles.includes("admin")
      ) {
        const user = await updateUser(req.params.id, req.body);
  
        res.status(200).json({
          user,
          message: "Account has been updated successfully",
        });
      } else {
        res.status(403).json({
          message: "You can only update your account",
        });
      }
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };
  
  // Update profile picture
  export const updateProfilePictureController = async (req, res) => {
    try {
      const userData = verifyToken(req);
  
      if (
        userData.id !== req.params.id &&
        !userData.roles.includes("admin")
      ) {
        return res.status(403).json({
          message: "You can only update your profile picture",
        });
      }
  
      const user = await updateProfilePicture(
        req.params.id,
        req.file.path
      );
  
      res.status(200).json({
        user,
        message: "Profile picture has been updated successfully",
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };
  
  // Delete user
  export const deleteUserController = async (req, res) => {
    try {
      const userData = verifyToken(req);
  
      if (
        userData.id === req.params.id ||
        userData.roles.includes("admin")
      ) {
        await deleteUser(req.params.id);
  
        res.status(200).json({
          message: "Account has been deleted successfully",
        });
      } else {
        res.status(403).json({
          message: "You can only delete your account",
        });
      }
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };
  
  // Get user by ID
  export const getUserController = async (req, res) => {
    try {
      verifyToken(req);
  
      const user = await getUser(req.params.id);
  
      const { password, ...data } = user._doc;
  
      res.status(200).json({
        userInfo: data,
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };
  
  // Get all users - Admin only
  export const getAllUsersController = async (req, res) => {
    try {
      const userData = verifyToken(req);
  
      if (!userData.roles.includes("admin")) {
        return res.status(403).json({
          message: "Admin access required",
        });
      }
  
      const users = await getAllUsers();
  
      res.status(200).json({
        data: users,
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };