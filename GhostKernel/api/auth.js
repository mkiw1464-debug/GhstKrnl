const fs = require('fs');
const path = require('path');

// Baca file users.json
const usersPath = path.join(__dirname, '../users.json');

exports.handler = async (event) => {
    // Cuma allow method POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { user, pass } = JSON.parse(event.body);
        
        // Baca users database
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);
        
        // Cari user yang cocok
        const foundUser = users.find(u => u.username === user && u.password === pass);
        
        // Cek apakah user ada dan belum expired (pake timezone Malaysia)
        if (foundUser) {
            const now = new Date();
            const expired = new Date(foundUser.expired);
            
            // Convert ke timezone Malaysia buat perbandingan
            const nowMalaysia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
            const expiredMalaysia = new Date(expired.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
            
            if (nowMalaysia <= expiredMalaysia) {
                // Login sukses
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Set-Cookie': `session=${foundUser.username}; Path=/; HttpOnly; Max-Age=86400`
                    },
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Login berhasil',
                        username: foundUser.username,
                        expired: expiredMalaysia.toISOString()
                    })
                };
            } else {
                // User expired
                return {
                    statusCode: 401,
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Akun sudah expired! Hubungi owner untuk perpanjang.' 
                    })
                };
            }
        } else {
            // User tidak ditemukan
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Username atau password salah!' 
                })
            };
        }
    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error' 
            })
        };
    }
};
