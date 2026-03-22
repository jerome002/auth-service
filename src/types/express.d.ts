import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      // Using 'any' for now to stop the immediate crash, 
      // but you can replace this with your User interface later.
      user?: any; 
    }
  }
}

// This empty export is necessary to turn this file into a module
export {};