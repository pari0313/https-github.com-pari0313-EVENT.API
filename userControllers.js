import db from "../..database/memory.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallback";
const TOKEN_EXPIRES_IN = "8h";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "name, email and password required" });
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const roleNormalized = role === "Organizer" ? "Organizer" : "Attendee";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    role: roleNormalized
  };
  db.users.push(user);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
  res.status(201).json({
    message: "Registered",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password required" });

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

  res.json({
    message: "Logged in",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token
  });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};