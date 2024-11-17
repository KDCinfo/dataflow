export default class AppHelpers {
  static formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
