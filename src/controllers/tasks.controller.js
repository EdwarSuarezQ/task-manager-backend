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
    const tasks = await Tasks.find({
      user: req.user.id,
      completed: false,
    });

    const now = new Date();

    const notifications = tasks
      .map((task) => {
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
          generatedAt: now,
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
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const users = await User.find();
    const tasks = await Tasks.find();

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

    alerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    res.json({
      summary,
      alerts,
    });
  } catch (error) {
    console.error("Error en getAdminNotifications:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener alertas del admin" });
  }
};
