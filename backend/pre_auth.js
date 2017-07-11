const uuid = require("uuid");
const rp = require("request-promise");
const config = require("./config.js");

import Session from "./Session.js";

let reqs = {};

export async function sso(req, resp) {
    let ct = req.query.client_token;
    if(!ct) {
        return resp.send(`
<script>
var enc = encodeURIComponent(window.location.href);
window.location.replace("https://oneidentity.me/web/?callback=" + enc + "#auth");
</script>
        `);
    }

    let r = await rp.post("https://oneidentity.me/identity/verify/verify_client_token", {
        form: {
            client_token: ct
        }
    });
    r = JSON.parse(r);

    if(r.err !== 0) {
        throw r.msg;
    }

    let user_id = r.userId;
    if(user_id != config.USER_ID) {
        throw "Permission denied";
    }

    let sess = Session.create(user_id);

    let req_id = req.query.req_id;
    if(req_id) {
        reqs[req_id] = sess;
        return resp.json({
            err: 0,
            msg: "OK"
        });
    } else {
        return resp.json({
            err: 0,
            msg: "OK",
            token: sess.id
        });
    }
}

export function get_session(req, resp) {
    let req_id = req.body.req_id;
    if(!req_id || !reqs[req_id]) throw new Error("Not found");

    let sess = reqs[req_id];
    delete reqs[req_id];

    return resp.json({
        err: 0,
        msg: "OK",
        token: sess.id
    });
}