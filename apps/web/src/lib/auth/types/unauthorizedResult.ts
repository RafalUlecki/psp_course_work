export interface UnauthorizedHttpResult {
  status: 401;
  body: { error: "unauthorized" };
}
