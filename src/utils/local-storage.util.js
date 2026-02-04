export const localStorageKeys = Object.freeze({
  CURRENT_USER: 'orbit360-current-user',
  CURRENT_EMPLOYEE: 'orbit360-current-employee',
  ACCESS_TOKEN: 'orbit360-access-token',
  ACCESS_TOKEN_EXPIRES_AT: 'orbit360-access-token-expires',
});

export class LocalStorageUtil {
  static keys = [...Object.values(localStorageKeys)];

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
