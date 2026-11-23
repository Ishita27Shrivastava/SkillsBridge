

const express = require("express");
const Project = require("../models/ProjectModel");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Add Project
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, technologies, githubLink, liveLink } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        const project = await Project.create({
            user: req.user.id,
            title,
            description,
            technologies: technologies || [],
            githubLink: githubLink || "",
            liveLink: liveLink || ""
        });

        res.status(201).json({
            message: "Project added successfully!",
            project
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Logged-in User Projects
router.get("/", authMiddleware, async (req, res) => {
    try {
        const projects = await Project.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Projects fetched successfully!",
            projects
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Project
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json({
            message: "Project updated successfully!",
            project
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Project
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json({
            message: "Project deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
