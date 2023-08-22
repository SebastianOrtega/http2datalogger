const express = require('express');
const bodyParser = require('body-parser');
const net = require('net');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

function readConfigFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const config = {};

    for (let line of lines) {
        const [key, value] = line.split('=');
        if (key && value) {
            config[key.trim()] = value.trim();
        }
    }

    return config;
}

const config = readConfigFile('config.txt');
const variablesArray = config.orden.split(",").map(item => item.trim());
console.log({ ...config, orden: variablesArray });

function buildString(item, variables) {
    const values = [];

    for (let variable of variables) {
        if (variable in item.data) {
            values.push(item.data[variable]);
        } else if (variable in item) {
            values.push(item[variable]);
        }
    }

    return values.join(',');
}

app.post('/zebra/:name', (req, res) => {
    console.log('Received JSON:', req.body);
    const name = req.params.name;

    const client = new net.Socket();
    client.connect(10000, '192.168.0.44', () => {
        for (let item of req.body) {
            const dataToSend = buildString({ ...item, name }, variablesArray);
            client.write(dataToSend + "\n");
        }
        client.end();
    });

    client.on('error', (error) => {
        console.error('Error with the socket:', error);
        res.status(500).send('Error communicating with the TCP socket.');
    });

    client.on('close', () => {
        console.log('Socket connection closed.');
        res.send('Data sent successfully.');
    });
});

app.listen(config.puerto_POST_Zebra, () => {
    console.log(`Server is running on port ${config.puerto_POST_Zebra}`);
});
