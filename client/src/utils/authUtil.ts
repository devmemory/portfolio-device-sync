import { Cookies } from "react-cookie";
import { AUTH_ENUM } from "src/constants";
import { UserModel } from "src/models";

export const authUtil = {
  get isLoggedIn() {
    const cookies = new Cookies();
    const accessToken = cookies.get(AUTH_ENUM.accessToken);

    return !!accessToken;
  },
  get getToken() {
    const cookies = new Cookies();
    const accessToken = cookies.get(AUTH_ENUM.accessToken);
    const refreshToken = cookies.get(AUTH_ENUM.refreshToken);

    return { accessToken, refreshToken };
  },
  get getUser() {
    const user = localStorage.getItem(AUTH_ENUM.user);
    return user ? (JSON.parse(user) as UserModel) : null;
  },
  setUser: (user: UserModel) => {
    localStorage.setItem(AUTH_ENUM.user, JSON.stringify(user));
  },
  setToken: (accessToken: string, refreshToken: string) => {
    const cookies = new Cookies();
    cookies.set(AUTH_ENUM.accessToken, accessToken, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60),
    });
    cookies.set(AUTH_ENUM.refreshToken, refreshToken, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60),
    });
  },
  deleteToken: () => {
    const cookies = new Cookies();
    cookies.remove(AUTH_ENUM.accessToken, { path: "/" });
    cookies.remove(AUTH_ENUM.refreshToken, { path: "/" });

    localStorage.removeItem(AUTH_ENUM.user);
  },
};
