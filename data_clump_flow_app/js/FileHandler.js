import AppConstants from './AppConstants.js';

export default class FileHandler {
  static objIsMap(obj) {
    return obj instanceof Map;
  }

  static handleExportData({
    clumpListToExport = null,
    storageName = AppConstants.defaultExportStorageName
  }) {
    // Data to export.
    // const clumpListToExport = this.dataManager.getData('clumpList');
    if (clumpListToExport !== null) {
      const dataStr = JSON.stringify(clumpListToExport, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dataflow_${storageName}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  // Extract and return clumps from one file
  // (or the first file if multiple files are selected).
  static async resolveClumpsFromFile() {
    return new Promise((resolve, reject) => {
      if (confirm(`\nWarning:\n
            Importing data will overwrite the current data.\n
            Are you sure you want to continue?\n`)) {
        //
        // document.getElementById('importFile').click();

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = e => {
          const file = e.target.files[0];
          if (!file) {
            alert('No file selected');
            reject('No file selected');
          }
          this.extractClumpsFromFile(file)
            .then((importedClumps) => resolve(importedClumps))
            .catch((error) => reject(error));
        }
        fileInput.click();
      } else {
        alert('User canceled the operation');
        reject('User canceled the operation');
      }
    }).catch((error) => {
      alert('Error importing data');
      console.error('Error importing data:', error);
    });
  }

  // The bulk file importer returns a map of both
  //   "filenames and their respective clumps" for all selected files.
  static async resolveFilenamesAndClumpsFromFile() {
    return new Promise((resolve, reject) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.multiple = true;
      fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) {
          alert('No file selected');
          reject('No file selected');
        }
        // Cycle through all selected files.
        const filePromises = Array.from(e.target.files).map(async cfile => {
          try {
            const importedClumps = await this.extractClumpsFromFile(cfile);
            return { filename: cfile.name, clumps: importedClumps };
          } catch (error) {
            console.error(`Error importing file ${cfile.name}:`, error);
            return { filename: cfile.name, clumps: ['error'] };
          }
        });
        Promise.all(filePromises)
          .then((results) => {
            const filenameClumpsMap = new Map();
            results.forEach(result => {
              // filenameClumpsMap[result.filename] = result.clumps;
              filenameClumpsMap.set(result.filename, result.clumps);
            });
            resolve(filenameClumpsMap);
          })
          .catch((error) => reject(error));
      }
      fileInput.click();
  }).catch((error) => {
      alert('Error importing data');
      console.error('Error importing data:', error);
    });
  }

  static async extractClumpsFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedClumps = JSON.parse(e.target.result);
          if (Array.isArray(importedClumps)) {
            //
            resolve(importedClumps);
            //
          } else {
            alert('Invalid data format');
            reject('Invalid data format');
          }
        } catch {
          alert('Failed to import data');
          reject('Failed to import data');
        }
      };
      reader.onerror = () => {
        alert('Error reading file');
        reject(new Error('File reading error'));
      };
      reader.readAsText(file);
    }).catch((error) => {
      alert('Error handling imported file');
      console.error('Error handling imported file:', error);
    });
  }
}
