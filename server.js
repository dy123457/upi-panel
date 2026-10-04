const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Empty UPI List - No pre-added IDs
let upiList = [];
let maintenanceMode = false;

// 1. PAYMENT PAGE (User Facing)
app.get('/pay', (req, res) => {
    if (maintenanceMode) {
        return res.send(`<!DOCTYPE html><html><body style="background:#121212;color:#fff;text-align:center;padding-top:20vh;font-family:sans-serif;"><h1>System Under Maintenance</h1><p>Please try again later.</p></body></html>`);
    }
    
    const activeUpiObj = upiList.find(u => u.active) || upiList[0];
    const activeUpi = activeUpiObj ? activeUpiObj.upi : "No UPI Added By Admin";
    const qrSource = activeUpiObj ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${activeUpi}&pn=LoanRepayment` : '';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pay Loan</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .card { background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 380px; box-sizing: border-box; text-align: center; }
                h2 { color: #202124; margin-bottom: 20px; letter-spacing: 1px; }
                .upi-box { display: flex; align-items: center; justify-content: space-between; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 6px; padding: 10px 12px; margin-bottom: 15px; }
                .upi-text { font-size: 15px; color: #3c4043; font-weight: 500; word-break: break-all; }
                .copy-btn { background: #1a73e8; color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; }
                .copy-btn:hover { background: #1557b0; }
                .qr-container { margin: 15px 0; }
                .qr-container img { width: 200px; height: 200px; border: 4px solid #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .timer { color: #d93025; font-weight: bold; margin-bottom: 20px; font-size: 15px; }
                input { width: 100%; padding: 12px; border: 1px solid #dadce0; border-radius: 6px; font-size: 15px; box-sizing: border-box; margin-bottom: 15px; outline: none; }
                input:focus { border-color: #1a73e8; }
                .submit-btn { background: #137333; color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
                .submit-btn:hover { background: #0f5132; }
                .footer-text { color: #137333; font-size: 13px; margin-top: 15px; font-weight: 500; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>PAY LOAN</h2>
                <div class="upi-box">
                    <span class="upi-text" id="upiId">${activeUpi}</span>
                    <button class="copy-btn" onclick="copyUpi()">Copy</button>
                </div>
                ${qrSource ? `<div class="qr-container"><img src="${qrSource}" alt="UPI QR"></div>` : '<p style="color:red; font-size:14px;">No Active UPI ID Configured</p>'}
                <div class="timer">Session Ends In: <span id="countdown">08:00</span></div>
                <form onsubmit="alert('UTR Submitted Successfully!'); return false;">
                    <input type="text" placeholder="Enter 12-Digit UTR Number" required maxlength="12">
                    <button type="submit" class="submit-btn">Submit UTR</button>
                </form>
                <div class="footer-text">100% Secure Payment</div>
            </div>

            <script>
                function copyUpi() {
                    const text = document.getElementById('upiId').innerText;
                    navigator.clipboard.writeText(text);
                    alert('UPI ID Copied: ' + text);
                }

                let duration = 8 * 60;
                const display = document.getElementById('countdown');
                setInterval(function () {
                    let minutes = parseInt(duration / 60, 10);
                    let seconds = parseInt(duration % 60, 10);
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                    display.textContent = minutes + ":" + seconds;
                    if (--duration < 0) { duration = 0; }
                }, 1000);
            </script>
        </body>
        </html>
    `);
});

// 2. ADMIN LOGIN PAGE
app.get('/admin/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: #1e1e1e; padding: 35px; border-radius: 12px; width: 320px; box-shadow: 0 4px 20px rgba(0,0,0,0.7); text-align: center; border: 1px solid #333; }
                .logo { width: 50px; height: 50px; background: #00e5ff; color: #000; font-weight: bold; font-size: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto 15px auto; box-shadow: 0 0 15px rgba(0,229,255,0.5); }
                h2 { color: #00e5ff; margin-bottom: 25px; font-size: 22px; }
                .input-group { text-align: left; margin-bottom: 15px; }
                label { font-size: 13px; color: #aaa; display: block; margin-bottom: 5px; }
                input { width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; color: #fff; border-radius: 6px; box-sizing: border-box; outline: none; }
                input:focus { border-color: #00e5ff; }
                .login-btn { background: #00e5ff; color: #000; border: none; padding: 12px; width: 100%; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
                .login-btn:hover { background: #00b3cc; }
                .footer { color: #777; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <div class="logo">A</div>
                <h2>Admin Login</h2>
                <form action="/admin/dashboard" method="GET">
                    <div class="input-group">
                        <label>Username</label>
                        <input type="text" name="user" placeholder="Enter username" required>
                    </div>
                    <div class="input-group">
                        <label>Password</label>
                        <input type="password" name="pass" placeholder="Enter password" required>
                    </div>
                    <button type="submit" class="login-btn">LOGIN SECURELY</button>
                </form>
                <div class="footer">Secure Admin Panel © 2026</div>
            </div>
        </body>
        </html>
    `);
});

// 3. ADMIN DASHBOARD
app.get('/admin/dashboard', (req, res) => {
    let upiHtml = '';
    if (upiList.length === 0) {
        upiHtml = '<p style="color:#aaa; font-style:italic;">No UPI IDs added yet. Add one above.</p>';
    } else {
        upiList.forEach(item => {
            upiHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #2a2a2a; padding: 10px 15px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #444;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="radio" name="activeUpi" ${item.active ? 'checked' : ''} onclick="window.location.href='/admin/select?id=${item.id}'">
                        <span style="color: #fff; font-size: 14px; word-break: break-all;">${item.upi}</span>
                    </div>
                    <a href="/admin/delete?id=${item.id}" style="color: #ff6b6b; text-decoration: none; font-size: 13px; font-weight: bold;">Remove</a>
                </div>
            `;
        });
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Dashboard</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #fff; margin: 0; padding: 20px; display: flex; justify-content: center; }
                .container { width: 100%; max-width: 450px; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                h2 { color: #4dabf7; margin: 0; }
                .logout-btn { background: #c92a2a; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold; text-decoration: none; font-size: 14px; }
                .card { background: #1e1e1e; padding: 20px; border-radius: 10px; border: 1px solid #333; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                h3 { color: #4dabf7; margin-top: 0; font-size: 18px; }
                p { color: #aaa; font-size: 14px; }
                input[type="text"] { width: calc(100% - 22px); padding: 10px; background: #2a2a2a; border: 1px solid #444; color: #fff; border-radius: 5px; margin-bottom: 10px; outline: none; }
                .action-btn { background: #1971c2; color: white; border: none; padding: 10px 15px; width: 100%; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 14px; }
                .action-btn:hover { background: #1864ab; }
                .status-inactive { color: #ff6b6b; font-weight: bold; }
                .status-active { color: #51cf66; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Admin Dashboard</h2>
                    <a href="/admin/login" class="logout-btn">Logout</a>
                </div>

                <!-- Maintenance Mode Card -->
                <div class="card">
                    <h3>Maintenance Mode</h3>
                    <p>Activate this to show a maintenance page to users.</p>
                    <p>Current Status: <span class="${maintenanceMode ? 'status-active' : 'status-inactive'}">${maintenanceMode ? 'ACTIVE' : 'INACTIVE'}</span></p>
                    <a href="/admin/toggle-maintenance"><button class="action-btn" style="background: ${maintenanceMode ? '#c92a2a' : '#d9480f'};">${maintenanceMode ? 'Deactivate' : 'Activate'}</button></a>
                </div>

                <!-- Manage UPI IDs Card -->
                <div class="card">
                    <h3>Manage UPI IDs</h3>
                    <p>Add New UPI ID</p>
                    <form action="/admin/add" method="POST">
                        <input type="text" name="newUpi" placeholder="example@upi" required>
                        <button type="submit" class="action-btn">Add UPI</button>
                    </form>
                    <div style="margin-top: 20px;">
                        <p style="font-weight: bold; color: #fff;">Existing UPI IDs (Select active)</p>
                        ${upiHtml}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Admin Actions Backend Routes
app.post('/admin/add', (req, res) => {
    const newUpi = req.body.newUpi;
    if (newUpi) {
        const newId = upiList.length > 0 ? upiList[upiList.length - 1].id + 1 : 1;
        // If this is the first UPI being added, make it active automatically
        const isFirst = upiList.length === 0;
        upiList.push({ id: newId, upi: newUpi, active: isFirst });
    }
    res.redirect('/admin/dashboard');
});

app.get('/admin/delete', (req, res) => {
    const id = parseInt(req.query.id);
    upiList = upiList.filter(item => item.id !== id);
    // If deleted item was active, make the first available item active if any remain
    if (upiList.length > 0 && !upiList.some(u => u.active)) {
        upiList[0].active = true;
    }
    res.redirect('/admin/dashboard');
});

app.get('/admin/select', (req, res) => {
    const id = parseInt(req.query.id);
    upiList.forEach(item => {
        item.active = (item.id === id);
    });
    res.redirect('/admin/dashboard');
});

app.get('/admin/toggle-maintenance', (req, res) => {
    maintenanceMode = !maintenanceMode;
    res.redirect('/admin/dashboard');
});

// Server Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`UPI Panel running successfully on port ${PORT}`);
});