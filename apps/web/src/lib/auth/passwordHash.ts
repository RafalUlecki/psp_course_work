import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

import type {
  HashPasswordProps,
  VerifyPasswordProps,
} from "./types/passwordHash";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";

interface DeriveKeyProps {
  password: string;
  salt: Buffer;
  keyLength: number;
}

const deriveKey = (props: DeriveKeyProps): Promise<Buffer> => {
  const { password, salt, keyLength } = props;

  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, (error, derivedKey) => {
      if (error !== null) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
};

export const hashPassword = async (
  props: HashPasswordProps,
): Promise<string> => {
  const { password } = props;
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derivedKey = await deriveKey({
    password,
    salt,
    keyLength: PASSWORD_KEY_LENGTH,
  });

  return `${salt.toString("hex")}${HASH_SEPARATOR}${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (
  props: VerifyPasswordProps,
): Promise<boolean> => {
  const { password, passwordHash } = props;
  const separatorIndex = passwordHash.indexOf(HASH_SEPARATOR);

  if (separatorIndex <= 0) {
    return false;
  }

  const saltHex = passwordHash.slice(0, separatorIndex);
  const hashHex = passwordHash.slice(separatorIndex + HASH_SEPARATOR.length);

  if (saltHex.length % 2 !== 0 || hashHex.length % 2 !== 0) {
    return false;
  }

  if (saltHex.length === 0 || hashHex.length === 0) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  if (salt.length === 0 || expected.length === 0) {
    return false;
  }

  const derivedKey = await deriveKey({
    password,
    salt,
    keyLength: expected.length,
  });

  if (derivedKey.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expected);
};
