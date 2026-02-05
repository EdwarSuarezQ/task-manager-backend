import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { TOKEN_SECRET } from "../config.js";

export const authRequired = async (req, res, next) => {
  try {
    let { token } = req.cookies;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Cuenta bloqueada. Contacta al administrador." });
    }

    req.user = {
      id: user._id,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido" });
  }
};
