import { Request, Response, NextFunction } from "express";

/**
 * Wraps async express handlers to catch errors and pass them to next()
 * Eliminates the need for try/catch in every controller.
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};