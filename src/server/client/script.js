document.getElementById('fetch-urls').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword-input').value;

    if (!keyword) {
        alert('Please enter a keyword');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/urls', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({keyword})
        });
        
        if (!response.ok) {
            throw new Error('Keyword not found');
        }
      
        const urls = await response.json();
        displayUrls(urls);
    }  catch (error) {
        alert(error.message);
    }
});


function displayUrls(urls) {
    const urlList = document.getElementById('url-list');
    urlList.innerHTML = '';

    urls.forEach(url => {
        const urlItem = document.createElement('div');
        urlItem.textContent = url;
        urlItem.classList.add('url-item');
        urlItem.style.cursor = 'pointer';

        urlItem.addEventListener('click', () => {
            document.querySelectorAll('.url-item').forEach(item => item.style.backgroundColor = '');
            urlItem.style.backgroundColor = '#e0e0e0';
            loadContentFromLocalStorage(url) || downloadContent(url);
        });
        
        urlList.appendChild(urlItem);
    });
}


async function downloadContent(url) {
    const statusDiv = document.getElementById('download-status');
    statusDiv.textContent = 'Downloading...';
    
    try {
        const response = await fetch('http://localhost:5000/download', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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
            const {done, value} = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;
            statusDiv.textContent = `Downloaded ${receivedLength} bytes`;
        }
        
        const blob = new Blob(chunks);
        const urlObject = URL.createObjectURL(blob);
        
        const iframe = document.createElement('iframe');
        iframe.src = urlObject;
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        
        contentDisplay.innerHTML = '';
        contentDisplay.appendChild(iframe);
        
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
        });
        
        localStorage.setItem(url, base64Data);
   
        // Проверка на заполненность localStorage
        if (localStorage.length + 1 >= localStorage.quota) {
            // Очистка localStorage
            localStorage.clear();
        }
    } catch (error) {
        alert(error.message);
    }
}


function loadContentFromLocalStorage(url) {
    const base64Data = localStorage.getItem(url);

    if (base64Data) {
        const decodedData = atob(base64Data.split(',')[1]);

        const blob = new Blob([decodedData], {type: 'text/html'});
        const urlObject = URL.createObjectURL(blob);
        
        const iframe = document.createElement('iframe');
        iframe.src = urlObject;
        iframe.style.width = '100%';
        iframe.style.height = '400px';

        const contentDisplay = document.getElementById('content-display');
        contentDisplay.innerHTML = '';
        contentDisplay.appendChild(iframe);
        
        return true;
    }

    return false;
}
