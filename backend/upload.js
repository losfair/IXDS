const uuid = require("uuid");
const tmp = require("tmp");
const lzma = require("lzma-native");
const cp = require("child_process");
import Session from "./Session.js";

export let uploads = {};

export function handle_upload(req, resp, next) {
    try {
        let sess = Session.get(req.header("Token")).require_authorized();
        console.log("Upload from user " + sess.user_id);
    } catch(e) {
        resp.json({
            err: -1,
            msg: "" + e
        });
        return;
    }

    let data = ""
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
        try {
            req.uploaded = Buffer.from(data, "base64");
        } catch(e) {
            resp.json({
                err: 1,
                msg: "Unable to parse uploaded data"
            });
            return;
        }
        next();
    });
}

export function handle_end(req, resp) {
    let uploaded = req.uploaded;

    let dec = lzma.createDecompressor();
    let td = tmp.dirSync();

    console.log("Created tmp dir: " + td.name);

    let tar_extractor = cp.spawn("tar", ["-x", "-C", td.name], {
        stdio: "pipe"
    });

    let sent = false;

    tar_extractor.stdout.pipe(process.stdout);
    tar_extractor.stderr.pipe(process.stdout);
    tar_extractor.on("error", e => {
        if(sent) return;
        sent = true;
        resp.json({
            err: 1,
            msg: "" + e
        });
    });
    tar_extractor.on("exit", () => {
        if(sent) return;
        sent = true;

        let id = uuid.v4();
        uploads[id] = td.name;

        resp.json({
            err: 0,
            msg: "OK",
            upload_id: id
        });
    });

    dec.pipe(tar_extractor.stdin);
    dec.write(uploaded);
    dec.on("error", e => {
        if(sent) return;
        sent = true;
        resp.json({
            err: 1,
            msg: "" + e
        });
    });
}
