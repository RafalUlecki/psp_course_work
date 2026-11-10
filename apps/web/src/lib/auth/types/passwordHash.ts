export interface HashPasswordProps {
  password: string;
}

export interface VerifyPasswordProps {
  password: string;
  passwordHash: string;
}
