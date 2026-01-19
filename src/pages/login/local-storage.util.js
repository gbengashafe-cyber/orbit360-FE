export class LoginUtil {
  accessToken = '';
  key = 'orbit360-access-token';

  static storeAccessToken = (token) => {
    localStorage.setItem(this.key, token);
  };

  static removeAccessToken = () => {
    localStorage.removeItem(this.key);
  };

  static getAccessToken = () => {
    return localStorage.getItem(this.key);
  };
}
