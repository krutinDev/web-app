document.getElementById('fetch-urls').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword-input').value;
    if (!keyword) {
        alert('Please enter a keyword');
        return;
    }

    // Запрос списка URL по ключевому слову
    try {
        const response = await fetch('http://localhost:5000/urls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyword })
        });
        
        if (!response.ok) {
            throw new Error('Keyword not found');
        }

        const urls = await response.json();
        displayUrls(urls);
    } catch (error) {
        alert(error.message);
    }
});

function displayUrls(urls) {
    const urlList = document.getElementById('url-list');
    urlList.innerHTML = ''; // Очищаем предыдущий список

    urls.forEach(url => {
        const urlItem = document.createElement('div');
        urlItem.textContent = url;
        urlItem.classList.add('url-item');
        urlItem.style.cursor = 'pointer';
        urlItem.addEventListener('click', () => {
            // Убираем выделение со всех элементов
            document.querySelectorAll('.url-item').forEach(item => item.style.backgroundColor = '');
            // Выделяем выбранный элемент
            urlItem.style.backgroundColor = '#e0e0e0';
            downloadContent(url);
        });
        urlList.appendChild(urlItem);
    });
}

async function downloadContent(url) {
    // Отображаем статус загрузки
    const statusDiv = document.getElementById('download-status');
    statusDiv.textContent = 'Downloading...';

    try {
        const response = await fetch('http://localhost:5000/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error('Failed to download content');
        }

        const reader = response.body.getReader();
        const contentDisplay = document.getElementById('content-display');
        let receivedLength = 0;
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            statusDiv.textContent = `Downloaded ${receivedLength} bytes`;
        }

        const blob = new Blob(chunks);
        const urlObject = URL.createObjectURL(blob);
        contentDisplay.innerHTML = `<iframe src="${urlObject}" style="width:100%; height:400px;"></iframe>`;
    } catch (error) {
        alert(error.message);
    }
}