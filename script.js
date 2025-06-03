document.addEventListener('DOMContentLoaded', () => {
    const socialMediaUrlInput = document.getElementById('socialMediaUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');
    const downloadLinksDiv = document.getElementById('downloadLinks');
    const errorMessageP = document.getElementById('errorMessage');

    // GANTI DENGAN API KEY ANDA JIKA DIPERLUKAN OLEH API
    // const API_KEY = "YOUR_API_KEY_HERE"; // Jika API key dikirim sebagai header atau parameter lain

    const API_BASE_URL = "https://r-nozawa.hf.space/aio"; // Sesuai dokumentasi

    downloadBtn.addEventListener('click', handleDownload);
    socialMediaUrlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleDownload();
        }
    });

    async function handleDownload() {
        const url = socialMediaUrlInput.value.trim();
        if (!url) {
            displayError("URL tidak boleh kosong!");
            return;
        }

        // Validasi URL sederhana (opsional, bisa lebih canggih)
        if (!isValidHttpUrl(url)) {
            displayError("Format URL tidak valid. Pastikan menggunakan http:// atau https://");
            return;
        }

        showLoader(true);
        clearPreviousResults();

        try {
            // Konstruksi URL API
            // Jika API key perlu sebagai query parameter:
            // const apiUrl = `${API_BASE_URL}?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;
            const apiUrl = `${API_BASE_URL}?url=${encodeURIComponent(url)}`; // Sesuai format dari user

            const response = await fetch(apiUrl, {
                method: 'GET',
                // Jika API key perlu di header:
                // headers: {
                //     'Authorization': `Bearer ${API_KEY}` // atau 'X-API-Key': API_KEY
                // }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null); // Coba parse error JSON
                let errorMsg = `Gagal mengambil data. Status: ${response.status}`;
                if (errorData && errorData.detail) {
                     errorMsg = `Error: ${errorData.detail}`;
                } else if (errorData && errorData.message) {
                     errorMsg = `Error: ${errorData.message}`;
                } else if (response.status === 401) {
                    errorMsg = "Error: Akses tidak diizinkan. Periksa API Key Anda.";
                } else if (response.status === 404) {
                    errorMsg = "Error: URL tidak ditemukan atau endpoint API salah.";
                } else if (response.status === 422) {
                     errorMsg = "Error: URL tidak valid atau tidak didukung oleh API.";
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error("Error fetching data:", error);
            displayError(error.message || "Terjadi kesalahan saat mencoba mengunduh.");
        } finally {
            showLoader(false);
        }
    }

    function isValidHttpUrl(string) {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }

    function showLoader(show) {
        loader.style.display = show ? 'block' : 'none';
    }

    function clearPreviousResults() {
        downloadLinksDiv.innerHTML = '';
        errorMessageP.style.display = 'none';
        errorMessageP.textContent = '';
        resultArea.style.display = 'none';
    }

    function displayResults(data) {
        clearPreviousResults();
        resultArea.style.display = 'block';

        // Struktur respons API mungkin berbeda. Sesuaikan bagian ini.
        // Contoh asumsi: API mengembalikan objek dengan array 'links' atau 'downloadUrl'
        console.log("API Response Data:", data); // Untuk debugging

        if (data.result && Array.isArray(data.result)) { // Jika result adalah array (misal, beberapa kualitas)
            if (data.result.length === 0) {
                displayError("Tidak ada link unduhan yang ditemukan.");
                return;
            }
            data.result.forEach(item => {
                if (item.url) { // Jika ada properti 'url' di dalam array
                    const link = createDownloadLink(item.url, item.title || 'Unduh File');
                    downloadLinksDiv.appendChild(link);
                } else if (typeof item === 'string' && isValidHttpUrl(item)) { // Jika item adalah string URL
                    const link = createDownloadLink(item, 'Unduh File');
                    downloadLinksDiv.appendChild(link);
                }
            });
        } else if (data.result && typeof data.result === 'string' && isValidHttpUrl(data.result)) { // Jika result adalah string URL tunggal
            const link = createDownloadLink(data.result, data.title || 'Unduh File Utama');
            downloadLinksDiv.appendChild(link);
        } else if (data.url) { // Jika ada properti 'url' langsung di root objek
             const link = createDownloadLink(data.url, data.title || 'Unduh File Utama');
            downloadLinksDiv.appendChild(link);
        }
        // Cek struktur lain yang mungkin, seperti yang sering digunakan:
        else if (data.links && Array.isArray(data.links)) {
            data.links.forEach(linkObj => {
                if (linkObj.url) {
                    const link = createDownloadLink(linkObj.url, linkObj.quality || linkObj.type || 'Unduh');
                    downloadLinksDiv.appendChild(link);
                }
            });
        } else if (data.downloadUrl) { // Struktur umum lainnya
            const link = createDownloadLink(data.downloadUrl, data.title || 'Unduh File');
            downloadLinksDiv.appendChild(link);
        } else {
            // Jika struktur tidak diketahui, coba tampilkan apa adanya atau beri pesan error
            // Ini adalah bagian yang PALING PERLU disesuaikan setelah Anda melihat respons API sebenarnya
            let foundLink = false;
            for (const key in data) {
                if (typeof data[key] === 'string' && isValidHttpUrl(data[key])) {
                    const link = createDownloadLink(data[key], `Unduh (${key})`);
                    downloadLinksDiv.appendChild(link);
                    foundLink = true;
                } else if (Array.isArray(data[key])) {
                    data[key].forEach(item => {
                        if (typeof item === 'string' && isValidHttpUrl(item)) {
                             const link = createDownloadLink(item, `Unduh item`);
                             downloadLinksDiv.appendChild(link);
                             foundLink = true;
                        } else if (item && item.url && isValidHttpUrl(item.url)) {
                             const link = createDownloadLink(item.url, item.title || item.quality || `Unduh item`);
                             downloadLinksDiv.appendChild(link);
                             foundLink = true;
                        }
                    });
                }
            }
            if (!foundLink) {
                displayError("Tidak dapat menemukan link unduhan dalam respons API. Periksa struktur data.");
                console.log("Struktur data tidak dikenal:", data);
            }
        }

        if (downloadLinksDiv.children.length === 0 && !errorMessageP.style.display_block) {
             displayError("Tidak ada link unduhan yang valid ditemukan dalam respons.");
        }
    }

    function createDownloadLink(url, text) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank'; // Buka di tab baru
        link.setAttribute('download', ''); // Menyarankan browser untuk mengunduh
        link.innerHTML = `<i class="fas fa-cloud-download-alt"></i> ${text}`;
        return link;
    }

    function displayError(message) {
        clearPreviousResults();
        resultArea.style.display = 'block';
        errorMessageP.textContent = message;
        errorMessageP.style.display = 'block';
    }
});
