import { Role } from "@prisma/client";

/**
 *  Declaration Merging
 * We are extending the Express 'Request' interface to include our 
 * authenticated user object.
 */
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};