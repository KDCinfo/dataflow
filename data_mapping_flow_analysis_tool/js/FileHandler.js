export default class FileHandler {
  static handleExportData(clumpListToExport = null) {
    // Data to export.
    // const clumpListToExport = this.dataManager.getData('clumpList');
    if (clumpListToExport !== null) {
      const dataStr = JSON.stringify(clumpListToExport, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dataclumps.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  static async handleImportData() {
    return new Promise((resolve, reject) => {
      if (confirm(`\nWarning:\n
            Importing data will overwrite the current data.\n
            Are you sure you want to continue?\n`)) {
        //
        // document.getElementById('importFile').click();

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = e => {
          const file = e.target.files[0];
          if (!file) {
            alert('No file selected');
            reject('No file selected');
          }
          this.handleImportFile(file)
            .then((importedFile) => resolve(importedFile))
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

  static async handleImportFile(file) {
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
