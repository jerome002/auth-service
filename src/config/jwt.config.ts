import fs from "fs";
import path from "path";

const loadKey = (envVar: string, fileName: string): string => {
  // Check Environment Variable (Production / Docker)
  if (process.env[envVar]) {
    return Buffer.from(process.env[envVar]!, "base64").toString("utf-8");
  }

  // Check Local File (Development)
  const filePath = path.join(process.cwd(), "keys", fileName);
  
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      throw new Error(`CRITICAL: Found ${fileName} but could not read it. Check permissions.`);
    }
  }

  // If both fail, provide a helpful error instead of a generic crash
  console.error(`
    RSA KEY ERROR:
    Missing ${fileName}. 
    Please run: openssl genrsa -out keys/${fileName} 2048
    Or set the ${envVar} environment variable.
  `);
  
  process.exit(1); // Exit early with an error code
};

export const PRIVATE_KEY = loadKey("JWT_PRIVATE_KEY", "private.key");
export const PUBLIC_KEY = loadKey("JWT_PUBLIC_KEY", "public.key");