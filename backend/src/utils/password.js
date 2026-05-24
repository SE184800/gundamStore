import bcrypt from "bcryptjs";

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
