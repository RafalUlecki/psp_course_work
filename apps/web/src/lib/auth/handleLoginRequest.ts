import { createToken } from "./createToken";
import { INVALID_CREDENTIALS_ERROR } from "./errors";
import { parseLoginBody } from "./parseLoginBody";
import { hashPassword, verifyPassword } from "./passwordHash";
import { prismaAuthTokenStore } from "./prismaAuthTokenStore";
import { prismaUserStore } from "./prismaUserStore";
import type { AuthTokenStore } from "./types/authTokenStore";
import type {
  HandleLoginRequestProps,
  LoginHttpResult,
} from "./types/handleLoginRequest";
import type { UserStore } from "./types/userStore";

const invalidCredentialsResult = (): LoginHttpResult => ({
  status: 401,
  body: { error: INVALID_CREDENTIALS_ERROR },
});

let dummyPasswordHashPromise: Promise<string> | null = null;

const dummyPasswordHash = (): Promise<string> => {
  if (dummyPasswordHashPromise === null) {
    dummyPasswordHashPromise = hashPassword({
      password: "dummy-password-not-used",
    });
  }
  return dummyPasswordHashPromise;
};

export const handleLoginRequest = async (
  props: HandleLoginRequestProps,
  userStore: UserStore = prismaUserStore,
  tokenStore: AuthTokenStore = prismaAuthTokenStore,
): Promise<LoginHttpResult> => {
  const { bodyText, now = new Date() } = props;
  const parsed = parseLoginBody({ bodyText });

  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const user = await userStore.findByEmail(parsed.email);
  const passwordHash =
    user === null ? await dummyPasswordHash() : user.passwordHash;
  const passwordMatches = await verifyPassword({
    password: parsed.password,
    passwordHash,
  });

  if (user === null || !passwordMatches) {
    return invalidCredentialsResult();
  }

  const token = await createToken(
    {
      userId: user.id,
      clientId: user.clientId,
      now,
    },
    tokenStore,
  );

  return { status: 200, body: { token } };
};
