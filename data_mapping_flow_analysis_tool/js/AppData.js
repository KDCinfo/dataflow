export default class AppData {
  constructor(initialData = {}) {
    this.data = initialData;
  }

  getData(key) {
    return this.data[key];
  }

  setData(key, value) {
    this.data[key] = value;
  }

  async fetchData(url) {
    const response = await fetch(url);
    this.data = await response.json();
  }
}
