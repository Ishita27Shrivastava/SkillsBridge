
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get logged-in user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add skills
router.post("/skills", authMiddleware, async (req, res) => {
    try {
        const { skills } = req.body;

        if (!Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({ message: "Please provide skills" });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { skills: { $each: skills } } },
            { new: true }
        ).select("-password");

        res.json({ message: "Skills added successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a skill
router.delete("/skills", authMiddleware, async (req, res) => {
    try {
        const { skill } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { skills: skill } },
            { new: true }
        ).select("-password");

        res.json({ message: "Skill deleted successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all students
router.get("/users", authMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send connection request
router.post("/connections/request/:userId", authMiddleware, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ message: "You cannot connect with yourself" });
        }

        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({ message: "Student not found" });
        }

        const existing = await ConnectionRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: { $in: ["pending", "accepted"] }
        });

        if (existing) {
            return res.status(400).json({
                message: existing.status === "accepted"
                    ? "Already connected"
                    : "Connection request already exists"
            });
        }

        const rejectedRequest = await ConnectionRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: "rejected"
        });

        if (rejectedRequest) {
            rejectedRequest.status = "pending";
            await rejectedRequest.save();

            return res.json({
                message: "Connection request sent successfully",
                request: rejectedRequest
            });
        }

        const request = await ConnectionRequest.create({
            sender: senderId,
            receiver: receiverId
        });

        res.status(201).json({
            message: "Connection request sent successfully",
            request
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get sent and received requests
router.get("/connections/requests", authMiddleware, async (req, res) => {
    try {
        const receivedRequests = await ConnectionRequest.find({
            receiver: req.user.id,
            status: "pending"
        }).populate("sender", "name email skills");

        const sentRequests = await ConnectionRequest.find({
            sender: req.user.id,
            status: "pending"
        }).populate("receiver", "name email skills");

        res.json({ receivedRequests, sentRequests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Accept or reject request
router.patch("/connections/requests/:requestId", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request ID" });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const request = await ConnectionRequest.findOne({
            _id: requestId,
            receiver: req.user.id,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = status;
        await request.save();

        res.json({
            message: `Connection request ${status}`,
            request
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get accepted connections
router.get("/connections", authMiddleware, async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ],
            status: "accepted"
        })
        .populate("sender", "name email skills")
        .populate("receiver", "name email skills");

        const connections = requests.map((request) => {
            return request.sender._id.toString() === req.user.id
                ? request.receiver
                : request.sender;
        });

        res.json({ connections });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
