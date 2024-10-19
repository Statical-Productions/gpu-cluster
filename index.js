// Imports
const express = require("express");
const https = require('https');
const axios = require("axios");
const uuid = require("uuid");
const cors = require("cors");

// Variables
const API_KEY = process.env["API_KEY"];

const server = express(), api_port = 3000;
const bodyparser_configurations = { limit: "50mb", extended: true };

const version = "1" 

// Functions
const https_predict = (headers, url, session_hash, fn_index, data) => new Promise((resolve, reject) => {
  const session = session_hash || uuid.v4(), url_regex = url.match(/^(https?:\/\/)([^\/]+)(\/.*)$/);
  const req = https.request({ hostname: url_regex[2], path: url_regex[3].replace(/\/$/, ''), method: 'POST', headers: headers || {} }, (res) => res.on('data', (chunk) => resolve(JSON.parse(chunk))));
  req.on('error', (e) => reject(e)); req.write(JSON.stringify({ data: data, fn_index: fn_index, session_hash: session })); req.end();
});

const get_version = () => { console.log('[SYSTEM] ⚙️ Version', version); };

const get_address = async () => {
  try {
    const response = await axios.get('https://api.ipify.org');
    console.log("[SYSTEM] ☁️ Address - " + response.data);
  } catch (error) { console.error('[SYSTEM] 🔴 There was an error fetching IP address.', error); };
};

const generate = async (headers, input) => {
  try {
    const data = await https_predict(headers, ...input);
    return JSON.stringify(data);
  } catch (error) { console.warn('[SYSTEM] 🔴 There was an error generating data.', error); throw error; };
};

// Initialize

server.use(cors());
server.use(express.json(bodyparser_configurations));
server.use(express.urlencoded(bodyparser_configurations));
server.listen(api_port, () => { console.log(`[SYSTEM] 🟢 API server is running on ${api_port}`); });
server.all(`/`, (req, res) => { res.send(`[SYSTEM] 🟢 The server has been maintained!`); });

server.post('/generate', async (req, res) => {
  try {
    const key = req.headers['key'];

    if (!key) {
      const error = new Error('No key header provided');
      console.warn('[SYSTEM] 🔴 The provided key is invalid.', error);
      return res.status(401).send('Unauthorized: No API key provided');
    }

    if (key !== API_KEY) {
      const error = new Error('Invalid API key');
      console.warn('[SYSTEM] 🔴 The provided key is invalid.', error);
      return res.status(403).send('Forbidden: Invalid API key');
    }

    const result = await generate(req.headers, req.body);
    res.send(result);
  } catch (error) {
    console.warn('[SYSTEM] 🔴 There was an error generating data.', error);
    res.status(500).send('Internal Server Error');
  }
});

get_address()
get_version()

process.on('uncaughtException', (error) => { console.warn('[SYSTEM] 🔴 There was an uncaught error.', error) })
