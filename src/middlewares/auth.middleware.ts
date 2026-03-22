import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface TokenPayload {
  userId: string; // Using userId to match your LoginService logic
  email: string;
  role: Role;
}

/**
 * Main Authentication Guard
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Attach to request - matching the structure used in your controllers
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError 
      ? 'Token expired' 
      : 'Invalid token';
      
    return res.status(401).json({ success: false, message });
  }
};

/**
 * RBAC Guard Factory
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If authenticate didn't run or failed
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }

    next();
  };
};