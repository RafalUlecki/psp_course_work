import type {
  AddPublicApiRouteProps,
  IsPublicApiRouteProps,
} from "./types/publicApiRoutes";

/**
 * Paths that skip the Bearer-token check.
 * Empty on purpose: every current API route requires a token.
 * The PH-33 login route will be the first entry.
 */
export const PUBLIC_API_ROUTES: readonly string[] = [];

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
