import uploadOnCloudinary from "../config/cloudinary.js";
import upload from "../middleware/multer.js";
import User from "../model/userModel.js";

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

    const user = await User.findByIdAndUpdate(userId, {
      name,
      description,
      email,
      photoUrl,
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User notfound" });
    }


    return res.status(200).json({ message: "Profile updated successfully", user });
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
    return res.status(500).json({ message: `Failed to fetch users: ${error.message}` });
  }
};

// Update user (Admin)
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: `Failed to update user: ${error.message}` });
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
    return res.status(500).json({ message: `Failed to delete user: ${error.message}` });
  }
};
