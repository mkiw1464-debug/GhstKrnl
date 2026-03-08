const fs = require('fs');
const path = require('path');
const cookie = require('cookie');

const usersPath = path.join(__dirname, '../users.json');

exports.handler = async (event) => {
    try {
        // Parse cookie dari header
        const cookies = cookie.parse(event.headers.cookie || '');
        const sessionUser = cookies.session;
        
        if (!sessionUser) {
            return {
                statusCode: 401,
                body: JSON.stringify({ expired: 'Not logged in' })
            };
        }
        
        // Baca users database
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);
        
        // Cari user berdasarkan session
        const foundUser = users.find(u => u.username === sessionUser);
        
        if (foundUser) {
            const expiredDate = new Date(foundUser.expired).toLocaleString('ms-MY', { 
                timeZone: 'Asia/Kuala_Lumpur',
                dateStyle: 'full',
                timeStyle: 'long'
            });
            
            return {
                statusCode: 200,
                body: JSON.stringify({ expired: expiredDate })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ expired: 'User tidak ditemukan' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ expired: 'Error' })
        };
    }
};
