// Token verify take place here

import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;

      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(400).json({ message: "User doesn't have token" });
    }

    let verifyToken = await jwt.verify(token, process.env.JWT_SECRET);

    if (!verifyToken) {
      return res.status(400).json({ message: "User doesn't have valid token" });
    }

    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    return res.status(500).json({ message: `isAuth error ${error}` });
  }
};

export default isAuth;
