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
const { puerto_POST_Zebra, datalogger_ip, puerto_datalogger, orden, terminador_lineas } = config;
const variablesArray = orden.split(",").map(item => item.trim());
const terminador = terminador_lineas.replace(/\\n\\r/g, '\n\r').replace(/\\n/g, '\n');
console.log({ ...config, orden: variablesArray, terminador_lineas: terminador });


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
    try {
        client.connect(puerto_datalogger, datalogger_ip, () => {
            for (let item of req.body) {
                const dataToSend = buildString({ ...item, name }, variablesArray);
                client.write(dataToSend + terminador);
            }
            client.end();
        });
    } catch (error) {
        console.error('Error connecting to the socket:', error);
        res.status(500).send('Error connecting to the TCP socket.');
        return;
    }

    client.on('error', (error) => {
        console.error('Error with the socket:', error);
       // res.status(500).send('Error communicating with the TCP socket.');
    });

    client.on('close', () => {
        console.log('Socket connection closed.');
        res.send('Data sent successfully.');
    });
});

app.listen(puerto_POST_Zebra, () => {
    console.log(`Server is running on port ${puerto_POST_Zebra}`);
});
