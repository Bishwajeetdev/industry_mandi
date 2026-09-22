import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import LoginActivity from "../models/LoginActivity.js";
const token = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});
export async function register(req, res) {
  const e = validationResult(req);
  if (!e.isEmpty())
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", error: e.array() });
  const { name, email, password, role = "buyer", company } = req.body;
  if (role === "admin")
    return res
      .status(403)
      .json({ success: false, message: "Admin registration is disabled" });
  if (await User.findOne({ email }))
    return res
      .status(409)
      .json({ success: false, message: "Email already registered" });
  const user = await User.create({
    name,
    email,
    password,
    role,
    status: role === "vendor" ? "pending" : "approved",
    profile: { company },
  });
  const pending = role === "vendor";
  res.status(201).json({
    success: true,
    message: pending
      ? "Registration submitted for administrator approval"
      : "Registration successful",
    data: { user: publicUser(user), token: pending ? null : token(user) },
  });
}
export async function login(req, res) {
  const u = await User.findOne({ email: req.body.email }).select("+password");
  if (!u || !(await u.matchPassword(req.body.password)))
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  if (u.status !== "approved")
    return res
      .status(403)
      .json({ success: false, message: `Account is ${u.status}` });
  await LoginActivity.create({
    user: u._id,
    email: u.email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.json({
    success: true,
    message: "Login successful",
    data: { user: publicUser(u), token: token(u) },
  });
}
export const me = (req, res) =>
  res.json({
    success: true,
    message: "Profile retrieved",
    data: publicUser(req.user),
  });
