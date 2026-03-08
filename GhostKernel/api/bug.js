const cookie = require('cookie');
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '../users.json');

// Simulated bug function (sebenernya panggil dari functions/bug.js)
async function runBug(target, payload) {
    // Ini nanti panggil file bug.js asli
    // Tapi untuk Netlify Functions, perlu di-require dengan path benar
    try {
        const bugFunction = require('../functions/bug.js');
        await bugFunction.run(target, payload);
        return { success: true, message: `Bug ${payload} dikirim ke ${target}` };
    } catch (e) {
        console.error('Bug error:', e);
        return { success: false, message: 'Gagal kirim bug: ' + e.message };
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        // Cek session
        const cookies = cookie.parse(event.headers.cookie || '');
        const sessionUser = cookies.session;
        
        if (!sessionUser) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized - Silakan login dulu' })
            };
        }
        
        // Cek apakah user masih valid dan belum expired
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);
        const foundUser = users.find(u => u.username === sessionUser);
        
        if (!foundUser) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'User tidak valid' })
            };
        }
        
        // Cek expired
        const now = new Date();
        const expired = new Date(foundUser.expired);
        if (now > expired) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Akun expired! Hubungi owner.' })
            };
        }
        
        // Parse body
        const { target, payload } = JSON.parse(event.body);
        
        if (!target || !payload) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Target dan payload wajib diisi!' })
            };
        }
        
        // Execute bug
        const result = await runBug(target, payload);
        
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal error: ' + error.message })
        };
    }
};
