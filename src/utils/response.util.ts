import { Response } from "express";

interface ApiResponse {
  res: Response;
  status?: number;
  success?: boolean;
  message?: string;
  data?: any;
  errors?: any[];
}

/**
 * Standardized API Response Wrapper
 * Ensures Consistent API Contract { success, data, message, errors }
 */
export const sendResponse = ({
  res,
  status = 200,
  success = true,
  message = "Operation successful",
  data = {},
  errors = [],
}: ApiResponse) => {
  return res.status(status).json({
    success,
    message,
    data,
    errors,
  });
};