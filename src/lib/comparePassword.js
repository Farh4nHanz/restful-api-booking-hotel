import bcrypt from "bcryptjs";

export const comparePassword = (password, hashed) => {
  return bcrypt.compareSync(password, hashed);
};
