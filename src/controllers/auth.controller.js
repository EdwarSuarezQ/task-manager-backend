import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userFound = await User.findOne({ email });
    if (userFound) return res.status(400).json(["the email is already in use"]);

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: passwordHash,
      role: "user",
      isActive: true,
    });

    const userSaved = await newUser.save();
    const token = await createAccessToken({ id: userSaved._id });
    res.cookie("token", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });
    res.json({
      success: true,
      token: token,
      user: {
        id: userSaved._id,
        username: userSaved.username,
        email: userSaved.email,
      },
      createdAt: userSaved.createdAt,
      updatedAt: userSaved.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userFound = await User.findOne({ email });
    if (!userFound)
      return res.status(400).json({ message: "usuario no encontrado" });

    if (!userFound.isActive) {
      return res
        .status(403)
        .json({ message: "Cuenta bloqueada. Contacta al administrador." });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch)
      return res.status(400).json({ message: "contraseña incorrecta" });

    const token = await createAccessToken({ id: userFound._id });
    res.cookie("token", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });
    res.json({
      success: true,
      token: token,
      user: {
        id: userFound._id,
        username: userFound.username,
        email: userFound.email,
        role: userFound.role,
        isActive: userFound.isActive,
      },
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });
  return res.sendStatus(200);
};

export const profile = async (req, res) => {
  const userFound = await User.findById(req.user.id);

  if (!userFound) return res.status(400).json({ message: "user not found" });

  return res.json({
    id: userFound._id,
    username: userFound.username,
    email: userFound.email,
    role: userFound.role,
    isActive: userFound.isActive,
    createdAt: userFound.createdAt,
    updatedAt: userFound.updatedAt,
  });
};

export const verifyToken = async (req, res) => {
  let { token } = req.cookies;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "unauthorized" });

  jwt.verify(token, TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(401).json({ message: "unauthorized" });

    const userFound = await User.findById(user.id);
    if (!userFound) return res.status(401).json({ message: "unauthorized" });

    return res.json({
      success: true,
      valid: true,
      user: {
        id: userFound._id,
        username: userFound.username,
        email: userFound.email,
        role: userFound.role,
        isActive: userFound.isActive,
      },
    });
  });
};

export const updateProfile = async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.id;

  try {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "El email ya está en uso por otro usuario",
      });
    }

    const existingUsername = await User.findOne({
      username,
      _id: { $ne: userId },
    });

    if (existingUsername) {
      return res.status(400).json({
        message: "El nombre de usuario ya está en uso",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        email,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    //verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "La contraseña actual es incorrecta" });
    }

    //encriptar la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    //actualizar la contraseña
    await User.findByIdAndUpdate(userId, { password: passwordHash });

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    //verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "La contraseña es incorrecta" });
    }

    //eliminar el usuario
    await User.findByIdAndDelete(userId);

    //limpiar la cookie de token
    res.cookie("token", "", {
      expires: new Date(0),
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    res.json({ message: "Cuenta eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    console.log("Admin solicitando lista de usuarios:", req.user);

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    console.log("Usuarios encontrados:", users.length);
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  const { username, email, password, role = "admin" } = req.body;

  try {
    if (role === "super_admin") {
      const existingSuperAdmin = await User.findOne({ role: "super_admin" });
      if (existingSuperAdmin) {
        return res.status(400).json({
          message:
            "Ya existe un Super Administrador en el sistema. No se pueden crear más.",
        });
      }
    }

    if (role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message:
          "Solo un super administrador puede crear otros super administradores",
      });
    }

    if (!["admin", "super_admin"].includes(role)) {
      return res.status(400).json({
        message:
          "Rol inválido. Solo se pueden crear administradores o super administradores",
      });
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({
        message: "El email ya está en uso",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      email,
      password: passwordHash,
      role,
      isActive: true,
    });

    const adminSaved = await newAdmin.save();

    res.json({
      id: adminSaved._id,
      username: adminSaved.username,
      email: adminSaved.email,
      role: adminSaved.role,
      createdAt: adminSaved.createdAt,
      message: `Usuario ${
        role === "super_admin" ? "super administrador" : "administrador"
      } creado exitosamente`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//bloquear/desbloquear usuario
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.role === "super_admin" && !isActive) {
      return res.status(403).json({
        message: "No se puede bloquear al Super Administrador del sistema",
      });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "No tienes permisos para bloquear super administradores",
      });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "No puedes bloquear tu propia cuenta",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      ...updatedUser.toObject(),
      message: `Usuario ${
        isActive ? "desbloqueado" : "bloqueado"
      } exitosamente`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        message: "No se puede eliminar al Super Administrador del sistema",
      });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "No tienes permisos para eliminar super administradores",
      });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "No puedes eliminar tu propia cuenta",
      });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!["user", "admin", "super_admin"].includes(role)) {
      return res.status(400).json({
        message:
          "Rol invalido. Los roles validos son: user, admin, super_admin",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (role === "super_admin") {
      const existingSuperAdmin = await User.findOne({
        role: "super_admin",
        _id: { $ne: id },
      });

      if (existingSuperAdmin) {
        return res.status(400).json({
          message:
            "Ya existe un Super Administrador en el sistema. No puede haber más de uno.",
        });
      }
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "No puedes cambiar tu propio rol",
      });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "No tienes permisos para modificar super administradores",
      });
    }

    if (role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message:
          "Solo un super administrador puede crear otros super administradores",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      ...updatedUser.toObject(),
      message: `Rol del usuario cambiado a ${role} exitosamente`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const token = await createAccessToken({ id: user._id });
    res.cookie("token", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      message: "Token actualizado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
