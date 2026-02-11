import Tasks from "../models/task.model.js";
import User from "../models/user.model.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Tasks.find({ user: req.user.id }).populate("user");
    res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, date, completed } = req.body;

    const newTask = new Tasks({
      title,
      description,
      date,
      completed: completed || false,
      user: req.user.id,
    });

    const savedTasks = await newTask.save();
    res.json(savedTasks);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Tasks.findById(req.params.id).populate("user");
    if (!task) return res.status(404).json({ message: "task not found" });
    res.json(task);
  } catch (error) {
    return res.status(404).json({ message: "Task not found" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Tasks.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!task) return res.status(404).json({ message: "task not found" });
    res.json(task);
  } catch (error) {
    return res.status(404).json({ message: "Task not found" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Tasks.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "task not found" });
    return res.sendStatus(204);
  } catch (error) {
    return res.status(404).json({ message: "Task not found" });
  }
};

const checkTaskStatus = (taskDate) => {
  const today = new Date();
  const dueDate = new Date(taskDate);

  const todayReset = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dueDateReset = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );

  const diffTime = dueDateReset - todayReset;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue"; //vencida
  if (diffDays === 0) return "dueToday"; //vence hoy
  if (diffDays === 1) return "dueTomorrow"; //vence mañana
  return "ok";
};

export const getUserNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const readNotifications = user.readNotifications || [];

    const tasks = await Tasks.find({
      user: req.user.id,
      completed: false,
    });

    const now = new Date();

    const notifications = tasks
      .map((task) => {
        // Si la notificación ya fue leída, no la mostramos
        if (readNotifications.includes(task._id.toString())) return null;

        const status = checkTaskStatus(task.date);
        let message = null;

        if (status === "overdue") {
          message = `La tarea "${task.title}" está vencida.`;
        } else if (status === "dueToday") {
          message = `La tarea "${task.title}" vence hoy.`;
        } else if (status === "dueTomorrow") {
          message = `La tarea "${task.title}" vence mañana.`;
        }

        if (!message) return null;

        return {
          message,
          taskId: task._id,
          dueDate: task.date,
          generatedAt: task.date, // Usamos la fecha de la tarea para el tiempo relativo
          type: status, 
        };
      })
      .filter(Boolean);

    notifications.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(notifications);
  } catch (error) {
    console.error("Error en getUserNotifications:", error);
    return res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const currentUser = await User.findById(req.user.id);
    const readNotifications = currentUser.readNotifications || [];

    const users = await User.find();
    const tasks = await Tasks.find().populate("user", "username email");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      const taskDateReset = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );
      return taskDateReset < today && !task.completed;
    });

    const tasksDueToday = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      const taskDateReset = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );
      return taskDateReset.getTime() === today.getTime() && !task.completed;
    });

    const newUsersThisWeek = users.filter((user) => {
      const userDate = new Date(user.createdAt);
      const diffDays = (now - userDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const inactiveUsers = users.filter((user) => !user.isActive);

    const summary = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      inactiveUsers: inactiveUsers.length,
      tasksTotal: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      tasksOverdue: overdueTasks.length,
      tasksDueToday: tasksDueToday.length,
      newUsersThisWeek: newUsersThisWeek.length,
    };

    const detailedNotifications = [];

    // Agregar tareas vencidas
    overdueTasks.forEach((task) => {
      if (!readNotifications.includes(task._id.toString())) {
        detailedNotifications.push({
          type: "overdue",
          message: `La tarea "${task.title}" está vencida`,
          taskId: task._id,
          taskTitle: task.title,
          username: task.user?.username || "Usuario desconocido",
          dueDate: task.date,
          generatedAt: task.date, // Fecha real del evento
        });
      }
    });

    // Agregar tareas que vencen hoy
    tasksDueToday.forEach((task) => {
      if (!readNotifications.includes(task._id.toString())) {
        detailedNotifications.push({
          type: "dueToday",
          message: `La tarea "${task.title}" vence hoy`,
          taskId: task._id,
          taskTitle: task.title,
          username: task.user?.username || "Usuario desconocido",
          dueDate: task.date,
          generatedAt: task.date, // Fecha real del evento
        });
      }
    });

    // Agregar nuevos usuarios
    newUsersThisWeek.forEach((user) => {
      if (!readNotifications.includes(user._id.toString())) {
        detailedNotifications.push({
          type: "newUser",
          message: `Nuevo usuario registrado: ${user.username}`,
          userId: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          generatedAt: user.createdAt, // Fecha real del evento
        });
      }
    });

    // Ordenar: primero tareas vencidas, luego las de hoy, luego nuevos usuarios
    detailedNotifications.sort((a, b) => {
      const priority = { overdue: 1, dueToday: 2, newUser: 3 };
      if (priority[a.type] !== priority[b.type]) {
        return priority[a.type] - priority[b.type];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    const alerts = [
      overdueTasks.length > 0 && {
        message: `${overdueTasks.length} tarea(s) vencida(s) en el sistema`,
        count: overdueTasks.length,
      },
      tasksDueToday.length > 0 && {
        message: `${tasksDueToday.length} tarea(s) vence(n) hoy`,
        count: tasksDueToday.length,
      },
      newUsersThisWeek.length > 0 && {
        message: `${newUsersThisWeek.length} nuevo(s) usuario(s) esta semana`,
        count: newUsersThisWeek.length,
      },
      inactiveUsers.length > 0 && {
        message: `${inactiveUsers.length} usuario(s) inactivo(s)`,
        count: inactiveUsers.length,
      },
    ].filter(Boolean);

    res.json({
      summary,
      alerts,
      notifications: detailedNotifications,
    });
  } catch (error) {
    console.error("Error en getAdminNotifications:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener alertas del admin" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Notification ID required" });

    const user = await User.findById(req.user.id);
    
    if (!user.readNotifications.includes(id)) {
      user.readNotifications.push(id);
      await user.save();
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Error updating notification status" });
  }
};
