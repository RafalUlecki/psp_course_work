export const CLIENT_ID_STORAGE_KEY = "clientId";
export const DEFAULT_CLIENT_ID = "A";
export const TEST_CLIENT_A_ID = "A";
export const TEST_CLIENT_B_ID = "B";

export type TestClientId = typeof TEST_CLIENT_A_ID | typeof TEST_CLIENT_B_ID;

export const CLIENT_OPTIONS: { id: TestClientId; label: string }[] = [
  { id: TEST_CLIENT_A_ID, label: "Client A" },
  { id: TEST_CLIENT_B_ID, label: "Client B" },
];
