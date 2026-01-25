export class LoginUtil {
  static key = 'orbit360-access-token';

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

export class LocalStorageUtil {
  static keys = ['orbit360-current-user', 'orbit360-access-token'];

  static validateKey = (key) => {
    if (!this.keys.includes(key)) {
      throw new Error(`The provided key ${key} is not recognized`);
    }
    return;
  };
  static save = (content, key) => {
    this.validateKey(key);

    if (typeof content === 'object') {
      localStorage.setItem(key, JSON.stringify(content));
    } else {
      localStorage.setItem(key, content);
    }
  };

  static delete = (key) => {
    this.validateKey(key);

    localStorage.removeItem(key);
  };

  static get = (key) => {
    this.validateKey(key);
    return localStorage.getItem(key);
  };
}
