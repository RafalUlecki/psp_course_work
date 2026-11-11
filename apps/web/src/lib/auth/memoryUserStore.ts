import type { UserRecord, UserStore } from "./types/userStore";

export const createMemoryUserStore = (): UserStore => {
  const users: UserRecord[] = [];

  return {
    insert: async (record) => {
      const stored: UserRecord = { ...record };
      users.push(stored);
      return stored;
    },
    findById: async (id) => users.find((user) => user.id === id) ?? null,
    findByEmail: async (email) =>
      users.find((user) => user.email === email) ?? null,
    listByClientId: async (clientId) =>
      users
        .filter((user) => user.clientId === clientId)
        .map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
        }))
        .sort((left, right) => left.email.localeCompare(right.email)),
  };
};
