export interface AuthSignInModel {
  email: string;
  pw: string;
}

export interface AuthSignUpModel {
  email: string;
  pw?: string;
  name: string;
}

export interface AuthResModel extends TokenResponse {
  user: UserModel;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserModel {
  id: number;
  email: string;
  name: string;
}

export interface PwModel {
  oldPw: string;
  newPw: string;
}