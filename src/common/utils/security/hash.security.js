import { hashSync, compareSync } from "bcrypt";
export const Hash = ({
  plainText,
  salt_rounds = process.env.SALT_ROUNDS,
} = {}) => {
  if (!plainText) {
    throw new Error("Password is required for hashing");
  }

  return hashSync(plainText, Number(salt_rounds));
};
export const Compare = ({ plainText, cipherText } = {}) => {
  return compareSync(plainText, cipherText);
};
