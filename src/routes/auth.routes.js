import { Router } from "express";
import {
  register,
  login,
  logout,
  profile,
  verifyToken,
  updateProfile,
  changePassword,
  deleteAccount,
  getUsers,
  getUserById,
  createAdminUser,
  toggleUserStatus,
  deleteUser,
  changeUserRole,
  refreshToken,
} from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/validateToken.js";
import { adminRequired } from "../middlewares/adminRequired.js";
import { superAdminRequired } from "../middlewares/superAdminRequired.js";
import { validerSchema } from "../middlewares/validator.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validerSchema(registerSchema), register);

router.post("/login", validerSchema(loginSchema), login);

router.post("/logout", logout);

router.get("/verify", verifyToken);

router.get("/profile", authRequired, profile);

router.post("/refresh-token", authRequired, refreshToken);

router.put(
  "/profile",
  authRequired,
  validerSchema(updateProfileSchema),
  updateProfile
);

router.put(
  "/change-password",
  authRequired,
  validerSchema(changePasswordSchema),
  changePassword
);

router.delete(
  "/account",
  authRequired,
  validerSchema(deleteAccountSchema),
  deleteAccount
);

router.get("/users", adminRequired, getUsers);

router.get("/users/:id", adminRequired, getUserById);

router.put("/users/:id/toggle-status", adminRequired, toggleUserStatus);

router.delete("/users/:id", adminRequired, deleteUser);

router.put("/users/:id/change-role", superAdminRequired, changeUserRole);

router.post(
  "/create-admin",
  adminRequired,
  validerSchema(registerSchema),
  createAdminUser
);

export default router;
