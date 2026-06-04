const { spawn } = require('child_process');
const fs = require('fs');

console.log("🚀 Starting Tablet-Safe Firebase Login...");

// Spawn the firebase login process
const child = spawn('firebase', ['login', '--no-localhost'], { shell: true });

// Listen to the terminal output
child.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text); // Print it to the screen normally

    // Hunt for the elusive URL
    const match = text.match(/(https:\/\/auth\.firebase\.tools[^\s]+)/);
    if (match) {
        // Snatch it and save it to a text file!
        fs.writeFileSync('LOGIN_URL.txt', match[1]);
        console.log("\n\n===============================================");
        console.log("✨ MAGIC TRICK SUCCESSFUL! ✨");
        console.log("I caught the URL and saved it to LOGIN_URL.txt.");
        console.log("1. Look in your file explorer on the left.");
        console.log("2. Open LOGIN_URL.txt to easily copy the link.");
        console.log("3. Get your authorization code.");
        console.log("4. Paste it down below and hit Enter!");
        console.log("===============================================\n");
    }
});

// Route any errors and allow you to type into the terminal
child.stderr.on('data', err => process.stderr.write(err));
process.stdin.pipe(child.stdin);
