const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = '8728092334:AAGXWr7yWkot5wumQrSysYVBaJ5bg9R8-Yo';
const ownerId = '7658801101';
const bot = new TelegramBot(token, { polling: true });

const users = require('../users.json');

function saveUsers() {
    fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

// Fungsi format tanggal Malaysia
function formatMalaysiaTime(date) {
    return new Date(date).toLocaleString('ms-MY', { 
        timeZone: 'Asia/Kuala_Lumpur',
        dateStyle: 'full',
        timeStyle: 'long'
    });
}

// Cek owner
function isOwner(msg) {
    return msg.from.id.toString() === ownerId;
}

// Command /start dengan button
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    
    const opts = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '➕ Tambah User', callback_data: 'add_user' },
                    { text: '📋 List User', callback_data: 'list_user' }
                ],
                [
                    { text: '🗑️ Hapus User', callback_data: 'del_user' },
                    { text: '⏱️ Cek Expired', callback_data: 'cek_expired' }
                ],
                [
                    { text: '🔧 Panel Web', url: 'https://ghostkernel.netlify.app' },
                    { text: '📞 Hubungi Owner', url: 'tg://user?id=7658801101' }
                ]
            ]
        }
    };
    
    const welcomeText = `⚡ *GhostKernel Bot* ⚡\n\nSelamat datang *${userName}*!\n\nSistem bug WhatsApp paling powerfull.\nPilih menu di bawah ya bang:`;
    
    bot.sendMessage(chatId, welcomeText, opts);
});

// Handle callback query dari button
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id.toString();
    
    // Loading animation
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Proses...' });
    
    // Menu Tambah User (khusus owner)
    if (data === 'add_user') {
        if (!isOwner(callbackQuery)) {
            return bot.sendMessage(chatId, '❌ *Akses Ditolak!*\nCuma owner yang boleh.', { parse_mode: 'Markdown' });
        }
        
        bot.sendMessage(chatId, '📝 *Tambah User Baru*\n\nFormat: `/add username password masa`\nContoh: `/add alibaba gacor123 7d`\n\nMasa aktif: 1d, 7d, 30d', {
            parse_mode: 'Markdown'
        });
    }
    
    // Menu List User (khusus owner)
    if (data === 'list_user') {
        if (!isOwner(callbackQuery)) {
            return bot.sendMessage(chatId, '❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
        }
        
        if (users.length === 0) {
            return bot.sendMessage(chatId, '📭 *Belum ada user terdaftar.*', { parse_mode: 'Markdown' });
        }
        
        let list = '📋 *Daftar User GhostKernel (Malaysia Time):*\n\n';
        users.forEach((u, i) => {
            const expiredDate = formatMalaysiaTime(u.expired);
            const status = new Date(u.expired) > new Date() ? '✅ Aktif' : '❌ Expired';
            list += `${i+1}. *${u.username}* (${u.password})\n   ⏰ Exp: ${expiredDate}\n   📊 Status: ${status}\n\n`;
        });
        
        bot.sendMessage(chatId, list, { parse_mode: 'Markdown' });
    }
    
    // Menu Hapus User (khusus owner)
    if (data === 'del_user') {
        if (!isOwner(callbackQuery)) {
            return bot.sendMessage(chatId, '❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
        }
        
        let listUser = '🗑️ *Hapus User*\n\nPilih user yang mau dihapus:\n';
        const buttons = [];
        
        users.forEach((u, i) => {
            listUser += `${i+1}. ${u.username}\n`;
            buttons.push([{ text: `${i+1}. ${u.username}`, callback_data: `confirm_del_${u.username}` }]);
        });
        
        if (users.length === 0) {
            return bot.sendMessage(chatId, '📭 *Tidak ada user untuk dihapus.*', { parse_mode: 'Markdown' });
        }
        
        bot.sendMessage(chatId, listUser, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    }
    
    // Menu Cek Expired (untuk semua user)
    if (data === 'cek_expired') {
        // Cari user berdasarkan Telegram ID (perlu update users.json)
        const user = users.find(u => u.telegramId === userId);
        
        if (!user) {
            return bot.sendMessage(chatId, '❌ *Akun tidak ditemukan!*\nHubungi owner buat daftar.', { parse_mode: 'Markdown' });
        }
        
        const expiredDate = formatMalaysiaTime(user.expired);
        const now = new Date();
        const expired = new Date(user.expired);
        const diffTime = expired - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusMsg;
        if (diffDays > 0) {
            statusMsg = `✅ *Aktif*\nSisa: ${diffDays} hari`;
        } else {
            statusMsg = `❌ *Expired*\nUdah lewat ${Math.abs(diffDays)} hari`;
        }
        
        bot.sendMessage(chatId, `📊 *Info Akun ${user.username}*\n\n⏰ Expired: ${expiredDate}\n📈 Status: ${statusMsg}`, {
            parse_mode: 'Markdown'
        });
    }
    
    // Handle konfirmasi hapus user
    if (data.startsWith('confirm_del_')) {
        if (!isOwner(callbackQuery)) {
            return bot.sendMessage(chatId, '❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
        }
        
        const username = data.replace('confirm_del_', '');
        const index = users.findIndex(u => u.username === username);
        
        if (index !== -1) {
            users.splice(index, 1);
            saveUsers();
            
            // Kirim konfirmasi dan update pesan
            bot.editMessageText(`✅ *User ${username} berhasil dihapus!*`, {
                chat_id: chatId,
                message_id: msg.message_id,
                parse_mode: 'Markdown'
            });
            
            // Kirim pesan baru dengan button menu
            setTimeout(() => {
                bot.sendMessage(chatId, 'Kembali ke menu utama:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 Kembali ke Menu', callback_data: 'back_to_menu' }]
                        ]
                    }
                });
            }, 1000);
        }
    }
    
    // Kembali ke menu utama
    if (data === 'back_to_menu') {
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '➕ Tambah User', callback_data: 'add_user' },
                        { text: '📋 List User', callback_data: 'list_user' }
                    ],
                    [
                        { text: '🗑️ Hapus User', callback_data: 'del_user' },
                        { text: '⏱️ Cek Expired', callback_data: 'cek_expired' }
                    ],
                    [
                        { text: '🔧 Panel Web', url: 'https://ghostkernel.netlify.app' },
                        { text: '📞 Owner', url: 'tg://user?id=7658801101' }
                    ]
                ]
            }
        };
        
        bot.sendMessage(chatId, '⚡ *GhostKernel Menu Utama* ⚡\n\nPilih menu:', opts);
    }
});

// Handle command /add (via text)
bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    
    if (!isOwner(msg)) {
        return bot.sendMessage(chatId, '❌ *Lu siapa? Cuma owner yang bisa akses!*', { parse_mode: 'Markdown' });
    }
    
    const args = match[1].split(' ');
    
    if (args.length < 3) {
        return bot.sendMessage(chatId, '❌ *Format salah!*\nContoh: `/add alibaba gacor123 7d`', { parse_mode: 'Markdown' });
    }
    
    const username = args[0];
    const password = args[1];
    const duration = args[2]; // 1d, 7d, 30d
    
    let days;
    if (duration.includes('d')) {
        days = parseInt(duration.replace('d', ''));
    } else {
        return bot.sendMessage(chatId, '❌ *Masa aktif harus pake d!*\nContoh: 1d, 7d, 30d', { parse_mode: 'Markdown' });
    }
    
    // Validasi days
    if (![1, 7, 30].includes(days)) {
        return bot.sendMessage(chatId, '❌ *Pilihan hanya 1d, 7d, atau 30d!*', { parse_mode: 'Markdown' });
    }
    
    // Cek duplikat
    if (users.find(u => u.username === username)) {
        return bot.sendMessage(chatId, `❌ *Username ${username} udah ada!*`, { parse_mode: 'Markdown' });
    }
    
    const expired = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const newUser = {
        username,
        password,
        expired: expired.toISOString(),
        telegramId: msg.from.id.toString(),
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();
    
    const expiredDate = formatMalaysiaTime(expired);
    
    bot.sendMessage(chatId, `✅ *User Berhasil Ditambahkan!*\n\n👤 Username: ${username}\n🔑 Password: ${password}\n⏰ Expired: ${expiredDate}\n📆 Masa Aktif: ${days} hari`, {
        parse_mode: 'Markdown'
    });
    
    // Notifikasi ke owner (dirinya sendiri)
    bot.sendMessage(ownerId, `📢 *User Baru!*\n\n${username} - ${password} (${days}d)`, { parse_mode: 'Markdown' });
});

// Command /list via text
bot.onText(/\/list/, (msg) => {
    if (!isOwner(msg)) {
        return bot.sendMessage(msg.chat.id, '❌ *Akses ditolak!*', { parse_mode: 'Markdown' });
    }
    
    if (users.length === 0) {
        return bot.sendMessage(msg.chat.id, '📭 *Belum ada user terdaftar.*', { parse_mode: 'Markdown' });
    }
    
    let list = '📋 *Daftar User GhostKernel (Malaysia Time):*\n\n';
    users.forEach((u, i) => {
        const expiredDate = formatMalaysiaTime(u.expired);
        const status = new Date(u.expired) > new Date() ? '✅' : '❌';
        list += `${i+1}. *${u.username}* (${u.password})\n   ⏰ ${expiredDate} ${status}\n\n`;
    });
    
    bot.sendMessage(msg.chat.id, list, { parse_mode: 'Markdown' });
});

// Command /del via text
bot.onText(/\/del (.+)/, (msg, match) => {
    if (!isOwner(msg)) {
        return bot.sendMessage(msg.chat.id, '❌ *Akses ditolak!*', { parse_mode: 'Markdown' });
    }
    
    const username = match[1];
    const index = users.findIndex(u => u.username === username);
    
    if (index !== -1) {
        users.splice(index, 1);
        saveUsers();
        bot.sendMessage(msg.chat.id, `🗑️ *User ${username} berhasil dihapus!*`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(msg.chat.id, '❌ *User tidak ditemukan!*', { parse_mode: 'Markdown' });
    }
});

// Handle pesan lain
bot.on('message', (msg) => {
    // Abaikan command yang udah dihandle
    if (msg.text && (msg.text.startsWith('/') || msg.text.startsWith('.'))) return;
    
    // Auto reply buat yang bukan command
    if (msg.chat.type === 'private') {
        bot.sendMessage(msg.chat.id, 'Gunakan button menu ya bang 👇', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Kembali ke Menu', callback_data: 'back_to_menu' }]
                ]
            }
        });
    }
});

console.log('🔥 GhostKernel Telegram Bot aktif dengan timezone Malaysia!');
