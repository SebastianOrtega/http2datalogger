const axios = require('axios');
const https = require('https');
const process = require('process');

// Get command line arguments
const [url, password, command] = process.argv.slice(2);

if (!url || !password || !command) {
    console.error('Usage: node inicia.js <url> <password> <command>');
    process.exit(1);
}

const loginUrl = `https://${url}/cloud/localRestLogin`;

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function getToken() {
    try {
        const response = await axios.get(loginUrl, {
            auth: {
                username: 'admin',
                password: password
            },
            httpsAgent: agent
        });

        if (response.data && response.data.code === 0) {
            return response.data.message;
        } else {
            throw new Error('Error in getting the token');
        }

    } catch (error) {
        console.error('Failed to obtain token:', error.message);
    }
}

async function executeCommand(token) {
    try {
        const commandUrl = `https://${url}/cloud/${command}`;
        console.log("Command ", commandUrl);

        const response = await axios.put(commandUrl, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            httpsAgent: agent
        });

        console.log(response.data);

    } catch (error) {
        console.error('Failed to execute command:', error.message);
    }
}

async function main() {
    const token = await getToken();
    if (token) {
        await executeCommand(token);
    }
}

main();
