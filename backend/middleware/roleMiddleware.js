import User from "../model/userModel.js";

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin resources only." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: `Admin authorization error: ${error.message}` });
  }
};

export const isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "instructor") {
      return res.status(403).json({
        message: "Access denied. Instructor resources only.",
      });
    }

    req.authUser = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: `Instructor authorization error: ${error.message}`,
    });
  }
};
