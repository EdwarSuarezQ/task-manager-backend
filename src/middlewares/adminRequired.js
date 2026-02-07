import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { TOKEN_SECRET } from "../config.js";

export const adminRequired = async (req, res, next) => {
  try {
    let { token } = req.cookies;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token extraído de Authorization header");
    } else if (token) {
      console.log("Token extraído de Cookies");
    }

    if (!token) {
      console.log("No se encontró token en la petición");
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, TOKEN_SECRET);
    console.log("Token decodificado:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("Usuario no encontrado con ID:", decoded.id);
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    console.log("Usuario encontrado:", user.username, "Rol:", user.role);

    if (user.role !== "admin" && user.role !== "super_admin") {
      console.log("Usuario no tiene permisos. Rol actual:", user.role);
      return res.status(403).json({
        message: "Acceso denegado. Se requieren permisos de administrador",
      });
    }

    if (!user.isActive) {
      console.log("Usuario administrador está desactivado/bloqueado");
      return res
        .status(403)
        .json({ message: "Cuenta de administrador desactivada" });
    }

    req.user = {
      id: user._id,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (error) {
    console.error("Error en adminRequired middleware:", error.message);
    res.status(401).json({ message: "Token inválido" });
  }
};
