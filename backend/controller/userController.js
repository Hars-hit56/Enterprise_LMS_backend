import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import mongoose from "mongoose";

export const getCurrentUser = async (req, res) => {
  try {
    // select("-password")  in this way user password not show
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({ message: "User notfound" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Get Current User error ${error}` });
  }
};

// Controller for update profile

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { description, name, email } = req.body;
    let photoUrl;

    if (req.file) {
      photoUrl = await uploadOnCloudinary(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        description,
        email,
        photoUrl,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User notfound" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: `Update Profile error ${error}` });
  }
};

// --- Admin Controllers ---

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to fetch users: ${error.message}` });
  }
};

// Update user (Admin)
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined)
      updateData.email = String(email).trim().toLowerCase();

    const normalizedRole = normalizeRole(role);
    if (
      role !== undefined &&
      !["student", "instructor", "admin"].includes(normalizedRole)
    ) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (normalizedRole) updateData.role = normalizedRole;

    const normalizedStatus = normalizeStatus(status);
    if (status !== undefined && !normalizedStatus) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (normalizedStatus) updateData.status = normalizedStatus;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to update user: ${error.message}` });
  }
};

const normalizeRole = (role) => {
  if (!role) return undefined;
  return String(role).trim().toLowerCase();
};

const normalizeStatus = (status) => {
  if (!status) return undefined;

  const normalized = String(status).trim().toLowerCase();
  const statuses = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
  };

  return statuses[normalized];
};

// Update student user (Instructor)
export const updateUserByInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      updateData.email = trimmedEmail;
    }

    const normalizedStatus = normalizeStatus(status);
    if (status !== undefined && !normalizedStatus) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (normalizedStatus) updateData.status = normalizedStatus;

    if (targetUser.role !== "student") {
      return res.status(403).json({
        message: "Instructors can only edit student users",
      });
    }

    const enrolledInInstructorCourse = await Course.exists({
      creator: req.userId,
      enrolledStudents: id,
    });

    if (!enrolledInInstructorCourse) {
      return res.status(403).json({
        message: "Student is not enrolled in one of your courses",
      });
    }

    const normalizedRole = normalizeRole(role);
    if (role !== undefined && normalizedRole !== "student") {
      return res.status(403).json({
        message: "Instructors cannot change user roles",
      });
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to update user: ${error.message}`,
    });
  }
};

// Delete user (Admin)
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to delete user: ${error.message}` });
  }
};
