import crypto from "node:crypto";
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
});

export function encryptAsymmetric(text) {
  const buffer = Buffer.from(text);
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    buffer,
  );
  return encrypted.toString("hex");
}

export function decryptAsymmetric(encryptedText) {
  const buffer = Buffer.from(encryptedText, "hex");
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    buffer,
  );
  return decrypted.toString("utf-8");
}
