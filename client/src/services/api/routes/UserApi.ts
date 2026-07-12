import { AuthResModel, AuthSignInModel, AuthSignUpModel } from "src/models";
import { authUtil } from "src/utils";
import Api from "../api";

export class UserApi extends Api {
  public async login(model: AuthSignInModel) {
    const { data } = await this.post<AuthResModel>("/api/user/signin", model);

    if (data) {
      this._setUserData(data);
    }
  }

  public async register(model: AuthSignUpModel) {
    const { data } = await this.post<AuthResModel>("/api/user/signup", model);

    if (data) {
      this._setUserData(data);
    }
  }

  public async logout() {
    authUtil.deleteToken();
    location.href = "/";
  }

  private _setUserData(user: AuthResModel) {
    authUtil.setUser(user.user);
    authUtil.setToken(user.accessToken, user.refreshToken);
  }
}
