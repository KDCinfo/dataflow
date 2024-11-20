export default class AppHelpers {
  static formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Array of keys for int properties in a given class.
  static listOfKeysWithInts() {
    let intProps = [];
    for (const key in this) {
      if (typeof this[key] === 'number') {
        intProps.push(key);
      }
    }
    return intProps;
  }
}
