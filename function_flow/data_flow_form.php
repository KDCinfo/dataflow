<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Rows Application</title>
</head>
<body>
    <div id="dynamicForm">
        <button onclick="addRow()">Add Row</button>
        <button onclick="saveData()">Save Data</button>
        <button onclick="loadData()">Load Data</button>
        <button onclick="exportData()">Export Data</button>
        <input type="file" id="importFile" onchange="importData()" style="display: none;"/>
        <button onclick="document.getElementById('importFile').click()">Import Data</button>
        <table id="dataTable">
            <thead>
                <tr>
                    <th>Breadcrumb</th>
                    <th>Method Name</th>
                    <th>Code Block</th>
                    <th>Method Type</th>
                    <th>Variables/Properties</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
</body>
</html>
