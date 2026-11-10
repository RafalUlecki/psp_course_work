import type {
  AddPublicApiRouteProps,
  IsPublicApiRouteProps,
} from "./types/publicApiRoutes";

export const LOGIN_API_PATH = "/api/auth/login";

/**
 * Paths that skip the Bearer-token check.
 * Login is the only public route; every other API route requires a token.
 */
export const PUBLIC_API_ROUTES: readonly string[] = [LOGIN_API_PATH];

export const isPublicApiRoute = (props: IsPublicApiRouteProps): boolean => {
  const { pathname, publicRoutes = PUBLIC_API_ROUTES } = props;
  return publicRoutes.includes(pathname);
};

export const addPublicApiRoute = (
  props: AddPublicApiRouteProps,
): readonly string[] => {
  const { pathname, publicRoutes = PUBLIC_API_ROUTES } = props;
  if (publicRoutes.includes(pathname)) {
    return publicRoutes;
  }
  return [...publicRoutes, pathname];
};
