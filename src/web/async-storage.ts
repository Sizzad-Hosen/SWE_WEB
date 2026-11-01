const AsyncStorage = {
  async getItem(key: string) { return window.localStorage.getItem(key); },
  async setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
  async removeItem(key: string) { window.localStorage.removeItem(key); },
  async clear() { window.localStorage.clear(); },
  async multiGet(keys: string[]) {
    return keys.map((key) => [key, window.localStorage.getItem(key)] as [string, string | null]);
  },
  async multiRemove(keys: string[]) { keys.forEach((key) => window.localStorage.removeItem(key)); },
};

export default AsyncStorage;
