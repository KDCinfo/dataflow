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

  static handleImportData() {
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
          // alert('No file selected');
          return [];
        }
        return handleImportFile(file);
      }
      fileInput.click();
    }

    function handleImportFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedClumps = JSON.parse(e.target.result);
          if (Array.isArray(importedClumps)) {
            //
            return importedClumps;
            //
          } else {
            alert('Invalid data format');
            return [];
          }
        } catch {
          alert('Failed to import data');
          return [];
        }
      };
      reader.readAsText(file);
    }
  }
}
