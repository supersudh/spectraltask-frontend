export default class LocalStorage {
  static getMasterAddress(): string {
    return window.localStorage.getItem('masterAddress') || '';
  }
  static setMasterAddress(masterAddress: string): void {
    window.localStorage.setItem('masterAddress', masterAddress);
  }

  static login(jwt: string): void {
    window.localStorage.setItem('jwt', jwt);
  }
  static logout(): void {
    window.localStorage.removeItem('jwt');
  }
  static getJWT(): string {
    return window.localStorage.getItem('jwt') || '';
  }
}