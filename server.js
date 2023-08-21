const express = require('express');
const bodyParser = require('body-parser');
const net = require('net');

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Route to accept POST requests with JSON in the body
app.post('/', (req, res) => {
    console.log('Received JSON:', req.body);

    // Convert the JSON to a string and send to the TCP socket
    const dataToSend = JSON.stringify(req.body);

    const client = new net.Socket();
    client.connect(4000, '192.168.0.44', () => {
        client.write(dataToSend);
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

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
