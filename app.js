const MAX_FILE_SIZE = 0.5 * 1024 * 1024;
let currentFile = null;
let originalFileName = '';
let originalFileExt = '';
let deferredPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const textMode = $('text-mode');
    const fileMode = $('file-mode');
    const dropZone = $('drop-zone');
    const fileInput = $('file-input');
    const fileInfo = $('file-info');
    const fileNameSpan = $('file-name');
    const removeFile = $('remove-file');
    const passwordIn = $('password');
    const togglePass = $('toggle-pass');
    const encryptBtn = $('encrypt-btn');
    const decryptBtn = $('decrypt-btn');
    const resultArea = $('result-text');
    const outputSec = $('output-section');
    const copyBtn = $('copy-result');
    const downloadTxt = $('download-txt');
    const downloadJson = $('download-json');
    const toast = $('message');
    const pwaHeaderBtn = $('pwa-install-btn');
    const pwaHeaderContainer = $('pwa-install-container');
    const pwaFooterBtn = $('pwa-install-btn-footer');

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            textMode.classList.toggle('hidden', tab.dataset.mode !== 'text');
            fileMode.classList.toggle('hidden', tab.dataset.mode !== 'file');
            clearAll();
        });
    });

    if (dropZone && fileInput) {
        ['dragover', 'dragenter'].forEach(ev => dropZone.addEventListener(ev, e => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }));
        ['dragleave', 'dragend'].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.remove('dragover')));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
    }

    function handleFile(file) {
        if (file.size > MAX_FILE_SIZE) return showToast('File too large (max 0.5 MB)', 'error');
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['txt', 'json'].includes(ext)) return showToast('Only .txt and .json allowed', 'error');
        currentFile = file;
        originalFileName = file.name.replace(/\.[^.]+$/, '');
        originalFileExt = '.' + ext;
        fileNameSpan.textContent = file.name;
        fileInfo.classList.remove('hidden');
    }

    if (removeFile) removeFile.addEventListener('click', () => {
        currentFile = null;
        fileInfo.classList.add('hidden');
        fileInput.value = '';
    });

    if (togglePass) togglePass.addEventListener('click', () => {
        const type = passwordIn.type === 'password' ? 'text' : 'password';
        passwordIn.type = type;
        togglePass.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    if (encryptBtn) encryptBtn.addEventListener('click', async () => {
        const pwd = passwordIn.value.trim();
        if (!pwd) return showToast('Enter a password', 'error');
        try {
            const plain = currentFile ? await currentFile.text() : $('plain-text').value.trim();
            if (!plain) return showToast('Enter text or upload a file', 'error');
            const encrypted = await SalausCrypto.encrypt(plain, pwd);
            displayResult(encrypted, true);
            showToast('Encrypted successfully!', 'success');
        } catch (e) {
            showToast(e.message || 'Encryption failed', 'error');
        }
    });

    if (decryptBtn) decryptBtn.addEventListener('click', async () => {
        const pwd = passwordIn.value.trim();
        if (!pwd) return showToast('Enter a password', 'error');
        try {
            const input = currentFile ? await currentFile.text() : $('plain-text').value.trim();
            if (!input) return showToast('Enter encrypted data', 'error');
            const decrypted = await SalausCrypto.decrypt(input, pwd);
            displayResult(decrypted, false);
            showToast('Decrypted successfully!', 'success');
        } catch (e) {
            showToast(e.message || 'Decryption failed', 'error');
        }
    });

    function displayResult(content, isEncrypted) {
        resultArea.value = content;
        outputSec.classList.remove('hidden');
        const baseName = currentFile ? originalFileName : 'result';
        downloadTxt.onclick = () => download(content, baseName + (isEncrypted ? '.enc' : '') + '.txt');
        downloadJson.onclick = () => download(content, baseName + (isEncrypted ? '.enc' : '') + '.json');
    }

    function download(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (copyBtn) copyBtn.addEventListener('click', () => {
        resultArea.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    });

    function showToast(text, type) {
        toast.textContent = text;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    function clearAll() {
        $('plain-text').value = '';
        currentFile = null;
        fileInfo.classList.add('hidden');
        outputSec.classList.add('hidden');
        toast.classList.remove('show');
        passwordIn.value = '';
        if (SalausCrypto.wipePassword) SalausCrypto.wipePassword(passwordIn.value);
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaHeaderContainer) pwaHeaderContainer.classList.remove('hidden');
        if (pwaFooterBtn) pwaFooterBtn.style.display = 'flex';
    });

    const installPWA = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        showToast(outcome === 'accepted' ? 'Salaus installed!' : 'Installation cancelled', outcome === 'accepted' ? 'success' : 'error');
        deferredPrompt = null;
        if (pwaHeaderContainer) pwaHeaderContainer.classList.add('hidden');
        if (pwaFooterBtn) pwaFooterBtn.style.display = 'none';
    };

    if (pwaHeaderBtn) pwaHeaderBtn.addEventListener('click', installPWA);
    if (pwaFooterBtn) pwaFooterBtn.addEventListener('click', installPWA);

    window.addEventListener('appinstalled', () => {
        if (pwaHeaderContainer) pwaHeaderContainer.classList.add('hidden');
        if (pwaFooterBtn) pwaFooterBtn.style.display = 'none';
        showToast('Salaus is now installed!', 'success');
    });
});