
import express from "express";
import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All project routes require authentication.
router.use(authenticateToken);

// GET all projects belonging to the logged-in user.
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Could not retrieve projects.",
    });
  }
});

// CREATE a project.
router.post("/", async (req, res) => {
  try {
    const { name, description, category, color, dueDate } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description : null,
        category: typeof category === "string" ? category : null,
        color: typeof color === "string" ? color : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId,
      },
      include: {
        tasks: true,
      },
    });

    return res.status(201).json({
      message: "Project created successfully.",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Could not create project.",
    });
  }
});

// UPDATE a project.
router.put("/:id", async (req, res) => {
  try {
    const { name, description, category, color, dueDate } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        message: "Project name cannot be empty.",
      });
    }

    const project = await prisma.project.update({
      where: {
        id: existingProject.id,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(color !== undefined && { color }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
      include: {
        tasks: true,
      },
    });

    return res.json({
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      message: "Could not update project.",
    });
  }
});

// DELETE a project.
router.delete("/:id", async (req, res) => {
  try {
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    await prisma.project.delete({
      where: {
        id: existingProject.id,
      },
    });

    return res.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      message: "Could not delete project.",
    });
  }
});

export default router;
