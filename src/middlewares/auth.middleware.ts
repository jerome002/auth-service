import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt.util.js';
import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.util.js';
import { AuthenticationError } from '../services/auth.service.js';

/**
 * Main Authentication Guard (RS256)
 * Decision: Verifies JWT and checks for Soft Delete status.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    /**
     * Rule 3 Enforcement: The "Active User" Check
     * Decision: We verify that the user hasn't been deleted since the token was issued.
     */
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { deletedAt: true, isActive: true }
    });

    if (!user || user.deletedAt || !user.isActive) {
      logger.warn(`Unauthorized access attempt by deactivated user: ${decoded.sub}`);
      throw new AuthenticationError("Account is deactivated or does not exist", 401);
    }

    // Attach to request for controllers (Type-safe thanks to express.d.ts)
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    const message = error instanceof jwt.TokenExpiredError 
      ? 'Token expired' 
      : (error.message || 'Invalid token');
      
    return res.status(401).json({ success: false, message });
  }
};

/**
 * RBAC Guard Factory
 * Decision: Higher-Order Function to handle Role Based Access Control.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Forbidden access: User ${req.user.id} (Role: ${req.user.role}) tried to access ${req.path}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }

    next();
  };
};