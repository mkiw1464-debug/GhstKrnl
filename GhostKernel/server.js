const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
    secret: 'ghostkernel-secret',
    resave: false,
    saveUninitialized: true
}));

// User DB sederhana (file json)
let users = require('./users.json');

app.post('/api/auth', (req, res) => {
    const { user, pass } = req.body;
    const found = users.find(u => u.username === user && u.password === pass);
    if (found && new Date(found.expired) > new Date()) {
        req.session.user = user;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/api/bug', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
    const { target, payload } = req.body;
    require('./functions/bug.js').run(target, payload);
    res.json({ message: `Bug ${payload} dikirim ke ${target}` });
});

app.get('/api/check-expired', (req, res) => {
    if (!req.session.user) return res.json({ expired: 'Not logged in' });
    const user = users.find(u => u.username === req.session.user);
    res.json({ expired: user.expired });
});

app.listen(PORT, () => console.log(`GhostKernel running on port ${PORT}`));
