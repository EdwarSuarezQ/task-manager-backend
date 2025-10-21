import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getUserNotifications,
  getAdminNotifications,
} from "../controllers/tasks.controller.js";
import { validerSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchame } from "../schemas/task.schema.js";

const router = Router();

router.get("/tasks", authRequired, getTasks);

router.get("/tasks/:id", authRequired, getTask);

router.post(
  "/tasks",
  authRequired,
  validerSchema(createTaskSchame),
  createTask
);

router.delete("/tasks/:id", authRequired, deleteTask);

router.put("/tasks/:id", authRequired, updateTask);

router.get("/notifications", authRequired, getUserNotifications);

router.get("/admin/notifications", authRequired, getAdminNotifications);

export default router;
