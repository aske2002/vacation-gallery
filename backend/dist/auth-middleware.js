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
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.requireAdmin = requireAdmin;
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'vacation-gallery-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// Generate JWT token
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
// Verify JWT token
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}
// Hash password
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    });
}
// Compare password
function comparePassword(password, hash) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(password, hash);
    });
}
// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
// Optional authentication middleware (doesn't fail if no token)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        }
        catch (error) {
            // Ignore invalid tokens in optional auth
        }
    }
    next();
}
// Admin role middleware
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
// User ownership middleware (for accessing own resources)
function requireOwnershipOrAdmin(userIdField = 'userId') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            next();
        }
        else {
            res.status(403).json({ error: 'Access denied - insufficient permissions' });
        }
    };
}
