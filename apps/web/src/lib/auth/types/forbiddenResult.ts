export interface ForbiddenHttpResult {
  status: 403;
  body: { error: "forbidden" };
}
