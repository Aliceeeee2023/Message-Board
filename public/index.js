// 將表單資料送到後端
document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const nameInput = form.querySelector('#name');
    const messageInput = form.querySelector('#message');
    const fileInput = form.querySelector('#file');
    const formData = new FormData(form);

    if (nameInput.value.trim() === '' || messageInput.value.trim() === '' || fileInput.files.length === 0) {
        showMessage('姓名、帳號及檔案皆不得為空', 'error');
    } else {
        // 限制只能夠上傳圖片檔
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedImageTypes.includes(fileInput.files[0].type)) {
            showMessage('僅可上傳圖片檔案（JPEG, PNG, GIF）', 'error');
        } else {
            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (data.error) {
                    showMessage(data.error, 'error');
                } else {
                    showMessage(data.message, 'success');
                    prependMessage(data.newMessage);
                };
            } catch (error) {
                console.error('錯誤訊息：', error);
                showMessage('資料不完整，請重新操作', 'error');
            };
        };
    };
});

// 添加新留言到 getMessage 的最上方
function prependMessage(message) {
    const getMessage = document.getElementById('getMessage');

    const messageDiv = createMessageElement(message);
    getMessage.insertBefore(messageDiv, getMessage.firstChild);
};

// 顯示送出留言後的狀態
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';

    const messageDiv = document.createElement('div');
    messageDiv.style.color = 'red';
    messageDiv.style.fontWeight = 'bold';
    messageDiv.style.marginTop = '10px';
    messageDiv.textContent = message;
    messageArea.appendChild(messageDiv);
};

// 自動讀取資料庫後做排列（由新到舊）
async function loadMessages() {
    try {
        const response = await fetch('/getMessage');
        const data = await response.json();

        const getMessage = document.getElementById('getMessage');
        getMessage.innerHTML = '';

        if (data.error) {
            showMessage(data.error, 'error');
        } else {
            data.sort((a, b) => b.id - a.id);

            for (const message of data) {
                const messageDiv = createMessageElement(message);
                getMessage.appendChild(messageDiv);
            };
        };
    } catch (error) {
        console.error('錯誤：', error);
        showMessage('錯誤訊息', 'error');
    };
};

// 前端頁面生成
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name：';
    nameLabel.classList.add('label');
    nameLabel.style.fontSize = '16px';
    messageDiv.appendChild(nameLabel);

    const nameText = document.createElement('span');
    nameText.textContent = message.name;
    nameText.classList.add('input');
    nameText.style.fontSize = '14px';
    messageDiv.appendChild(nameText);

    const nameSpacer = document.createElement('div');
    nameSpacer.style.height = '30px';
    messageDiv.appendChild(nameSpacer);

    const messageLabel = document.createElement('label');
    messageLabel.textContent = 'Message：';
    messageLabel.classList.add('label');
    messageLabel.style.fontSize = '16px';
    messageDiv.appendChild(messageLabel);

    const messageText = document.createElement('span');
    messageText.textContent = message.message;
    messageText.classList.add('input');
    messageText.style.fontSize = '14px';
    messageDiv.appendChild(messageText);

    const messageSpacer = document.createElement('div');
    messageSpacer.style.height = '30px';
    messageDiv.appendChild(messageSpacer);

    const imageElement = document.createElement('img');
    imageElement.src = message.file;
    imageElement.classList.add('uploaded-image');
    messageDiv.appendChild(imageElement);

    const imageSpacer = document.createElement('div');
    imageSpacer.style.height = '20px';
    messageDiv.appendChild(imageSpacer);

    const separator = document.createElement('hr');
    separator.style.marginBottom = '30px';
    messageDiv.appendChild(separator);

    return messageDiv;
};

window.addEventListener('load', loadMessages);