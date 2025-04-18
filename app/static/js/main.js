const btnStart = $('#btnStart');
const btnCopy = $('#btnCopy');
const btnDownload = $('#btnDownload');
const textInput = $('#textInput');
const fileInput = $('#fileInput');
const apiKeyInput = $('#apiKeyInput');
const tabPane = $("#pills-tab");
const resultTable = $("#resultTable tbody");
const resultInfo = $('#resultInfo');

btnStart.on('click', function () {
    const activeTabId = tabPane.find('.nav-link.active').attr('id');
    const modeCheck = $('input[name="modeCheck"]:checked').val();
    const apiKey = apiKeyInput.val().trim()

    if (!apiKey) {
        alert('Missing api key!');
        return;
    }

    const formData = new FormData();
    formData.append("mode", modeCheck);
    formData.append('apikey', apiKey);

    if (activeTabId === "text-input-tab") {
        const rawText = textInput.val();
        const lines = rawText.split(/\r?\n/);
        const cleanLines = lines.map(line => line.trim()).filter(line => line !== "");
        const uniqueLines = [...new Set(cleanLines)];

        formData.append('urls', JSON.stringify(uniqueLines));
    } else if (activeTabId === "csv-file-tab") {
        const file = fileInput[0].files[0];
        formData.append("file", file);
    }

    $.ajax({
        type: "POST",
        url: "/check-index",
        data: formData,
        processData: false,
        contentType: false,
        beforeSend: function () {
            resultTable.empty();
        },
        success: function (response) {
            renderResultsToTable(response);
        }
    });
});

btnCopy.on('click', function () {
    let output = "";
    const rowData = resultTable.find('tr');
    rowData.each(function () {
        const url = $(this).find("td").eq(0).text().trim();
        const status = $(this).find("td").eq(1).text().trim();
        output += `${url}\t${status}\n`;
    });
    navigator.clipboard.writeText(output).then(() => {
        alert("Copied! You can paste it into Google Sheets.");
    }).catch(err => {
        alert("Failed to copy: " + err);
    });
});

btnDownload.on('click', function () {
    let csvContent = "data:text/csv;charset=utf-8,";
    const rowData = resultTable.find('tr');
    rowData.each(function () {
        const url = $(this).find("td").eq(0).text().trim();
        const status = $(this).find("td").eq(1).text().trim();
        const row = `"${url}","${status}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const linkDownload = document.createElement("a");
    linkDownload.setAttribute("href", encodedUri);
    linkDownload.setAttribute("download", "index_results.csv");
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
});

function renderResultsToTable(data) {
    let countTrue = 0, countFalse = 0, countNull = 0;
    for (const [url, status] of Object.entries(data)) {
        let statusText = "";
        let textClass = "";

        if (status === true) {
            statusText = "Indexed";
            textClass = "text-success";
            countTrue++;
        } else if (status === false) {
            statusText = "Not Indexed";
            textClass = "text-danger";
            countFalse++;
        } else {
            statusText = "Error";
            textClass = "text-warning";
            countNull++;
        }
        const row = `
            <tr>
                <td>${url}</td>
                <td class="${textClass}">${statusText}</td>
            </tr>
        `;
        resultTable.append(row);
    }
    const info = `Indexed: ${countTrue} | No Indexed: ${countFalse} | Error: ${countNull}`;
    resultInfo.text(info);
}
