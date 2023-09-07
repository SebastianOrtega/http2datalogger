const express = require('express');
const bodyParser = require('body-parser');
const net = require('net');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));

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

function splitIntoChunks(str) {
    return str.match(/.{1,4}/g).join(' ');
}

const config = readConfigFile('config.txt');
const { puerto_POST_Zebra, datalogger_ip, puerto_datalogger, orden, terminador_lineas, separador_palabras } = config;
const variablesArray = orden.split(",").map(item => item.trim());
const terminador = terminador_lineas.replace(/\\n\\r/g, '\n\r').replace(/\\n/g, '\n');
console.log({ ...config, orden: variablesArray, terminador_lineas: terminador, separador_palabras });
const matched = (str) => str.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);  //Regex to match IP address

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
    let ip = matched(req.ip)[0];
    const name = req.params.name;

    const client = new net.Socket();
    try {
        client.connect(puerto_datalogger, datalogger_ip, () => {
            for (let item of req.body) {
                let { idHex } = item.data;
                idHex = separador_palabras === "true" ? splitIntoChunks(idHex) : idHex;
                item.data.idHex = idHex;
                let dateObject = new Date(item.timestamp);
                let localDate = dateObject.toLocaleDateString();
                let localTime = dateObject.toLocaleTimeString(undefined, {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                item["localDate"] = localDate;
                item["localTime"] = localTime;
                item["ip"] = ip;
                console.log('Sending data:', item);
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
process.on('uncaughtException', function (err) {
    console.log("error inesperado", err);
});

app.listen(puerto_POST_Zebra, () => {
    console.log(`Server is running on port ${puerto_POST_Zebra}`);
});


