import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-123";

export function signJWT(payload: any) {
  const expiresIn = "365d";
  const now = new Date();
  const expirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Calculate expiration date in milliseconds

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

  // Get expiration time in seconds (for UTC)
  const expirationInSeconds = Math.floor(expirationDate.getTime() / 1000);

  return {
    token,
    expiry: expirationInSeconds,
  };
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
