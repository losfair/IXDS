const express = require("express");
const fs = require("fs");
const routing = require("./routing.js");
const config = require("./config.js");

const app = express();

async function run() {
    try {
        let cc = JSON.parse(fs.readFileSync(config.CLIENT_CREDS_FILE, "utf-8"));
        config.client_creds = cc;
    } catch(e) {}

    routing.init(app);
    app.listen(1712);
}

run().then(r => {}).catch(e => console.log(e));
