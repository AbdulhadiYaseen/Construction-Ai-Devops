import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_jwt_token_key";

export async function verifyAuth(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
}
