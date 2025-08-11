import { Router } from "express";
import { register, login, logout, profile,verifyToken } from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/validateToken.js";
import { validerSchema } from "../middlewares/validator.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post('/register', validerSchema(registerSchema), register);

router.post('/login', validerSchema(loginSchema), login);

router.post('/logout', logout);

router.get('/verify',  verifyToken );

router.get('/profile', authRequired, profile );

export default router;