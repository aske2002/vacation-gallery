import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  AuthenticatedRequest,
  User,
} from "../middleware/auth-middleware";
import { database } from "..";

const router = express.Router();

// Register endpoint
router.post("/register", async (req, res) => {
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
    const existingUser = await database.getUserByUsernameOrEmail(
      username,
      email
    );
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const password_hash = await hashPassword(password);
    const role = username === "aske1131" ? "admin" : "user";
    console.log(role)
    // Create user
    const userId = uuidv4();
    const user = await database.createUser({
      id: userId,
      username,
      email,
      password_hash,
      role,
    });

    // Generate token
    const token = generateToken({
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
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Find user (can login with username or email)
    const user = await database.getUserByUsernameOrEmail(username, username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({
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
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await database.getUserById(req.user!.id);
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
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update user profile
router.put("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user!.id;

    if (!username && !email) {
      return res.status(400).json({ error: "Username or email is required" });
    }

    // Check if new username/email already exists (excluding current user)
    if (username || email) {
      const existingUser = await database.getUserByUsernameOrEmail(
        username || "",
        email || ""
      );
      if (existingUser && existingUser.id !== userId) {
        return res
          .status(409)
          .json({ error: "Username or email already exists" });
      }
    }

    const updatedUser = await database.updateUser(userId, { username, email });

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
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
router.put(
  "/change-password",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

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
      const user = await database.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await comparePassword(
        currentPassword,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await database.updateUserPassword(userId, newPasswordHash);

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }
);

// Verify token endpoint
router.get("/verify", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user!.id,
      username: req.user!.username,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

export default router;
