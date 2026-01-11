// Version 3: SHA-512 with 1.2M iterations (current)
const VERSION_3 = 3;
const ITERATIONS_V3 = 1200000;
const SALT_LENGTH_V3 = 32;

// Version 2: SHA-512 with 800K iterations
const VERSION_2 = 2;
const ITERATIONS_V2 = 800000;
const SALT_LENGTH_V2 = 32;

// Version 1: SHA-256 with 1M iterations (legacy)
const VERSION_1 = 1;
const ITERATIONS_V1 = 1000000;
const SALT_LENGTH_V1 = 16;

// Current format version for new encryptions
const CURRENT_VERSION = VERSION_3;

// Common constants
const IV_LENGTH = 12;

// Version 3: SHA-512 with 1.2M iterations
async function deriveKeyV3(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: ITERATIONS_V3, hash: "SHA-512" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Version 2: SHA-512 with 800K iterations
async function deriveKeyV2(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: ITERATIONS_V2, hash: "SHA-512" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Version 1: SHA-256 with 1M iterations (legacy)
async function deriveKeyV1(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: ITERATIONS_V1, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_V3));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKeyV3(password, salt);
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, key, encoded
    ));
    const result = new Uint8Array(1 + SALT_LENGTH_V3 + IV_LENGTH + ciphertext.byteLength);
    result.set([CURRENT_VERSION], 0);
    result.set(salt, 1);
    result.set(iv, 1 + SALT_LENGTH_V3);
    result.set(ciphertext, 1 + SALT_LENGTH_V3 + IV_LENGTH);
    return uint8ToBase64Url(result);
}

async function decryptData(encryptedBase64, password) {
    let data;
    try {
        data = base64UrlToUint8(encryptedBase64);
    } catch (e) {
        throw new Error("Invalid Base64");
    }
    if (data.length < 30) throw new Error("Corrupted data");
    
    const version = data[0];
    
    // Version 3: SHA-512 with 1.2M iterations
    if (version === VERSION_3) {
        const salt = data.slice(1, 1 + SALT_LENGTH_V3);
        const iv = data.slice(1 + SALT_LENGTH_V3, 1 + SALT_LENGTH_V3 + IV_LENGTH);
        const ciphertext = data.slice(1 + SALT_LENGTH_V3 + IV_LENGTH);
        const key = await deriveKeyV3(password, salt);
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv }, key, ciphertext
            );
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) {
            throw new Error("Incorrect password or corrupted data");
        }
    }
    
    // Version 2: SHA-512 with 800K iterations
    if (version === VERSION_2) {
        const salt = data.slice(1, 1 + SALT_LENGTH_V2);
        const iv = data.slice(1 + SALT_LENGTH_V2, 1 + SALT_LENGTH_V2 + IV_LENGTH);
        const ciphertext = data.slice(1 + SALT_LENGTH_V2 + IV_LENGTH);
        const key = await deriveKeyV2(password, salt);
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv }, key, ciphertext
            );
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) {
            throw new Error("Incorrect password or corrupted data");
        }
    }
    
    // Version 1: SHA-256 with 1M iterations (legacy format)
    const compatibleData = (version === VERSION_1) ? data.slice(1) : data;
    const salt = compatibleData.slice(0, SALT_LENGTH_V1);
    const iv = compatibleData.slice(SALT_LENGTH_V1, SALT_LENGTH_V1 + IV_LENGTH);
    const ciphertext = compatibleData.slice(SALT_LENGTH_V1 + IV_LENGTH);
    const key = await deriveKeyV1(password, salt);
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv }, key, ciphertext
        );
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        throw new Error("Incorrect password or corrupted data");
    }
}

function uint8ToBase64Url(arr) {
    return btoa(String.fromCharCode(...arr))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlToUint8(str) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

function zeroPassword(pass) {
    if (typeof pass !== 'string') return;
    const buf = new Uint8Array(pass.length);
    crypto.getRandomValues(buf);
    for (let i = 0; i < pass.length; i++) {
        pass = pass.slice(0, i) + String.fromCharCode(buf[i]) + pass.slice(i + 1);
    }
}

window.encryptData = encryptData;
window.decryptData = decryptData;
window.zeroPassword = zeroPassword;