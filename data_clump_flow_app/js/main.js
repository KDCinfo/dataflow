import AppSettings from './AppSettings.js';
import { uiConfig } from './uiConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  // This is a self-running instantiation.
  new AppSettings(uiConfig);
  // const appSettings = new AppSettings(uiConfig);
  // await appSettings.loadData('/api/settings');
});
