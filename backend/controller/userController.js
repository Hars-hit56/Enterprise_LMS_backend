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
    const { description, name } = req.body;
    let photoUrl;

    if (req.file) {
      photoUrl = await uploadOnCloudinary(req.file.path);
    }

    const user = await User.findByIdAndUpdate(userId, {
      name,
      description,
      photoUrl,
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User notfound" });
    }


    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Update Profile error ${error}` });
  }
};
