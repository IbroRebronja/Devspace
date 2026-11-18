
import express from "express";
import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All task routes require authentication.
router.use(authenticateToken);

// GET all tasks belonging to the logged-in user.
router.get("/", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          is: {
            userId: req.userId,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Could not retrieve tasks.",
    });
  }
});

// CREATE a task inside one of the user's projects.
router.post("/projects/:projectId", async (req, res) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        userId: req.userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId: project.id,
      },
    });

    return res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Could not create task.",
    });
  }
});

// UPDATE a task.
router.put("/:id", async (req, res) => {
  try {
    const { title, done } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          is: {
            userId: req.userId,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({
        message: "Task title cannot be empty.",
      });
    }

    if (done !== undefined && typeof done !== "boolean") {
      return res.status(400).json({
        message: "Task completion status must be true or false.",
      });
    }

    const task = await prisma.task.update({
      where: {
        id: existingTask.id,
      },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(done !== undefined && { done }),
      },
    });

    return res.json({
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Could not update task.",
    });
  }
});

// DELETE a task.
router.delete("/:id", async (req, res) => {
  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          is: {
            userId: req.userId,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    await prisma.task.delete({
      where: {
        id: existingTask.id,
      },
    });

    return res.json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      message: "Could not delete task.",
    });
  }
});

export default router;
