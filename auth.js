import jwt from "jsonwebtoken";
import db from "../../database/memory.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallback";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid Authorization header" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};