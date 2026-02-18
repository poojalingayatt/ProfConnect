const ACCESS_TOKEN_KEY = 'profconnect_access_token';

export const token = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  set(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  remove() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
