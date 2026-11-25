export const bearerHeader = (
  token: string | null,
): Record<string, string> | undefined => {
  if (token === null) {
    return undefined;
  }
  return { Authorization: `Bearer ${token}` };
};