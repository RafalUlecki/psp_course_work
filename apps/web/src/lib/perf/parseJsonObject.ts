export const parseJsonObject = <T extends object>(text: string): T | null => {
  try {
    const value: T = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
};