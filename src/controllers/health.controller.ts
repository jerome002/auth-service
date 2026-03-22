import { Request, Response } from "express";
import { checkHealth } from "../services/health.service.js";

export const getHealth = (req: Request, res: Response) =>{
    const healthStatus = checkHealth();
    res.json(healthStatus);

}
 