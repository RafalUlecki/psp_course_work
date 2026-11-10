export interface CreateTokenProps {
  userId: string;
  clientId: string;
  now?: Date;
  ttlDays?: number;
}
