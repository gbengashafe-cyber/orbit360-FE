export class LoginUtil {
  static key = 'orbit360-access-token';

  static storeAccessToken = (token) => {
    console.log(this.key);

    localStorage.setItem(this.key, token);
  };

  static removeAccessToken = () => {
    localStorage.removeItem(this.key);
  };

  static getAccessToken = () => {
    return localStorage.getItem(this.key);
  };
}
