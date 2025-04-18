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
        Swal.fire({
            title: 'Thiếu API Key!',
            text: 'Vui lòng nhập API key trước khi tiếp tục.',
            icon: 'error',
        });
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

        if (uniqueLines.length == 0) {
            Swal.fire({
                title: 'Chưa nhập URLs!',
                text: 'Vui lòng nhập URLs để kiểm tra.',
                icon: 'error'
            });
            return;
        }

        formData.append('urls', JSON.stringify(uniqueLines));
    } else if (activeTabId === "csv-file-tab") {
        const file = fileInput[0].files[0];

        if (!file) {
            Swal.fire({
                title: 'Chưa chọn file!',
                text: 'Vui lòng chọn một file trước khi gửi.',
                icon: 'error'
            });
            return;
        }

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
            Swal.fire({
                title: 'Đang xử lý...',
                text: 'Vui lòng đợi một chút nhé!',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        },
        success: function (response) {
            renderResultsToTable(response);
            Swal.close();
            Swal.fire({
                title: 'Thành công!',
                text: 'Dữ liệu đã được xử lý.',
                icon: 'success',
                timer: 1500,
            });
        },
        error: function (xhr) {
            Swal.close();
            Swal.fire({
                title: 'Lỗi!',
                text: 'Đã xảy ra lỗi khi xử lý.',
                icon: 'error'
            });
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
        Swal.fire({
            title: 'Đã sao chép!',
            text: 'Nội dung đã được copy vào clipboard.',
            icon: 'success',
            timer: 1500,
        });
    }).catch(err => {
        Swal.fire({
            title: 'Thất bại!',
            text: 'Không thể sao chép. Trình duyệt có thể không hỗ trợ.',
            icon: 'error'
        });
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
    const info = `Indexed: ${countTrue} | Not Indexed: ${countFalse} | Error: ${countNull}`;
    resultInfo.text(info);
}
