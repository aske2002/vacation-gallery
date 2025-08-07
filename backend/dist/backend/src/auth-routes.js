"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const database_1 = require("./database");
const auth_middleware_1 = require("./auth-middleware");
const router = express_1.default.Router();
// Register endpoint
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Validation
        if (!username || !email || !password) {
            return res
                .status(400)
                .json({ error: "Username, email, and password are required" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ error: "Password must be at least 6 characters long" });
        }
        // Check if user already exists
        const existingUser = yield database_1.database.getUserByUsernameOrEmail(username, email);
        if (existingUser) {
            return res
                .status(409)
                .json({ error: "Username or email already exists" });
        }
        // Hash password
        const password_hash = yield (0, auth_middleware_1.hashPassword)(password);
        const role = username === "aske1131" ? "admin" : "user";
        console.log(role);
        // Create user
        const userId = (0, uuid_1.v4)();
        const user = yield database_1.database.createUser({
            id: userId,
            username,
            email,
            password_hash,
            role,
        });
        // Generate token
        const token = (0, auth_middleware_1.generateToken)({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
            token,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
}));
// Login endpoint
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Username and password are required" });
        }
        // Find user (can login with username or email)
        const user = yield database_1.database.getUserByUsernameOrEmail(username, username);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Check password
        const isValidPassword = yield (0, auth_middleware_1.comparePassword)(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate token
        const token = (0, auth_middleware_1.generateToken)({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        });
        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
}));
// Get current user profile
router.get("/me", auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield database_1.database.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Failed to get user profile" });
    }
}));
// Update user profile
router.put("/me", auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;
        if (!username && !email) {
            return res.status(400).json({ error: "Username or email is required" });
        }
        // Check if new username/email already exists (excluding current user)
        if (username || email) {
            const existingUser = yield database_1.database.getUserByUsernameOrEmail(username || "", email || "");
            if (existingUser && existingUser.id !== userId) {
                return res
                    .status(409)
                    .json({ error: "Username or email already exists" });
            }
        }
        const updatedUser = yield database_1.database.updateUser(userId, { username, email });
        res.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                updated_at: updatedUser.updated_at,
            },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
}));
// Change password
router.put("/change-password", auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ error: "Current password and new password are required" });
        }
        if (newPassword.length < 6) {
            return res
                .status(400)
                .json({ error: "New password must be at least 6 characters long" });
        }
        // Get current user
        const user = yield database_1.database.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Verify current password
        const isValidPassword = yield (0, auth_middleware_1.comparePassword)(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        // Hash new password
        const newPasswordHash = yield (0, auth_middleware_1.hashPassword)(newPassword);
        // Update password
        yield database_1.database.updateUserPassword(userId, newPasswordHash);
        res.json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
}));
// Verify token endpoint
router.get("/verify", auth_middleware_1.authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
        },
    });
});
exports.default = router;
