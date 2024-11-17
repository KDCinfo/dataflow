import AppSettings from './AppSettings.js';
import { uiConfig } from './uiConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const appSettings = new AppSettings(uiConfig);
  appSettings.loadData('/api/settings');
});
