function addRow() {
    const table = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    const cell3 = newRow.insertCell(2);
    const cell4 = newRow.insertCell(3);
    const cell5 = newRow.insertCell(4);

    cell1.innerHTML = '<input type="text" name="breadcrumb"/>';
    cell2.innerHTML = '<input type="text" name="methodName"/>';
    cell3.innerHTML = '<textarea name="codeBlock"></textarea>';
    cell4.innerHTML = '<input type="text" name="methodType"/>';
    cell5.innerHTML = '<input type="text" name="variables"/>';
}

function saveData() {
    const data = [];
    const rows = document.getElementById('dataTable').rows;
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].cells;
        const rowData = {
            breadcrumb: cells[0].getElementsByTagName('input')[0].value,
            methodName: cells[1].getElementsByTagName('input')[0].value,
            codeBlock: cells[2].getElementsByTagName('textarea')[0].value,
            methodType: cells[3].getElementsByTagName('input')[0].value,
            variables: cells[4].getElementsByTagName('input')[0].value,
        };
        data.push(rowData);
    }
    localStorage.setItem('rowData', JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('rowData'));
    if (data) {
        data.forEach((rowData) => {
            addRow();
            const lastRow = document.getElementById('dataTable').rows[document.getElementById('dataTable').rows.length - 1];
            lastRow.cells[0].getElementsByTagName('input')[0].value = rowData.breadcrumb;
            lastRow.cells[1].getElementsByTagName('input')[0].value = rowData.methodName;
            lastRow.cells[2].getElementsByTagName('textarea')[0].value = rowData.codeBlock;
            lastRow.cells[3].getElementsByTagName('input')[0].value = rowData.methodType;
            lastRow.cells[4].getElementsByTagName('input')[0].value = rowData.variables;
        });
    }
}

// For export and import functions, you'll need to handle file creation and file reading, which might involve more advanced JavaScript handling (e.g., using the File API).
