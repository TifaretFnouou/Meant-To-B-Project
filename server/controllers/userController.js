import {
  deleteUser,
  getUser,
  getAllUsers,
  updateProfilePicture,
  updateUser,
} from "../services/userService.js";
import { verifyToken, sanitizeUser } from "../services/authService.js";

function statusFromError(error, fallback = 401) {
  return error.status || fallback;
}

function isSelfOrAdmin(actor, targetId) {
  return String(actor.id) === String(targetId) || actor.roles?.includes("admin");
}

export const updateUserController = async (req, res) => {
  try {
    const actor = verifyToken(req);

    if (!isSelfOrAdmin(actor, req.params.id)) {
      return res.status(403).json({
        message: "You can only update your account",
      });
    }

    const user = await updateUser(req.params.id, req.body, actor);

    res.status(200).json({
      user,
      message: "Account has been updated successfully",
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const updateProfilePictureController = async (req, res) => {
  try {
    const actor = verifyToken(req);

    if (!isSelfOrAdmin(actor, req.params.id)) {
      return res.status(403).json({
        message: "You can only update your profile picture",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Profile picture file is required",
      });
    }

    const user = await updateProfilePicture(req.params.id, req.file);

    res.status(200).json({
      user,
      message: "Profile picture has been updated successfully",
    });
  } catch (err) {
    res.status(statusFromError(err, 400)).json({ error: err.message });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const actor = verifyToken(req);

    if (!isSelfOrAdmin(actor, req.params.id)) {
      return res.status(403).json({
        message: "You can only delete your account",
      });
    }

    await deleteUser(req.params.id);

    res.status(200).json({
      message: "Account has been deleted successfully",
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const getUserController = async (req, res) => {
  try {
    verifyToken(req);

    const user = await getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userInfo: sanitizeUser(user),
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const getUsersController = async (req, res) => {
  try {
    verifyToken(req);
    const users = await getAllUsers();

    res.status(200).json({
      data: users,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const actor = verifyToken(req);

    if (!actor.roles?.includes("admin")) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const users = await getAllUsers();

    res.status(200).json({
      data: users,
    });
  } catch (err) {
    res.status(statusFromError(err)).json({ error: err.message });
  }
};
