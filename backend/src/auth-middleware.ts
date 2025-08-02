import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET: string = process.env.JWT_SECRET || 'vacation-gallery-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

// Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

// Generate JWT token
export function generateToken(user: Omit<User, 'password_hash'>): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }
  
  next();
}

// Admin role middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// User ownership middleware (for accessing own resources)
export function requireOwnershipOrAdmin(userIdField: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied - insufficient permissions' });
    }
  };
}
