import {
  DEFAULT_CLIENT_ID,
  TEST_CLIENT_A_ID,
  TEST_CLIENT_B_ID,
  type TestClientId,
} from "./constants";

export const isTestClientId = (value: string): value is TestClientId =>
  value === TEST_CLIENT_A_ID || value === TEST_CLIENT_B_ID;

export const parseStoredClientId = (
  value: string | undefined,
): TestClientId => {
  if (value !== undefined && isTestClientId(value)) {
    return value;
  }

  return DEFAULT_CLIENT_ID;
};
