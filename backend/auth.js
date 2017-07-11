const uuid = require("uuid");
const pre_auth = require("./pre_auth.js");
const u2f = require("u2f");
const config = require("./config.js");
const fs = require("fs");

import Session from "./Session.js";

export function request_reg(req, resp) {
    if(config.client_creds) throw new Error("client_creds already set");
    let sess = Session.get(req.body.token).require_state(0);

    let u2f_req = u2f.request(config.APP_ID);
    console.log(u2f_req);
    sess.ctx = {
        reg_req: u2f_req
    };
    sess.state = 1;

    resp.json(u2f_req);
}

export function verify_reg(req, resp) {
    if(config.client_creds) throw new Error("client_creds already set");
    let sess = Session.get(req.body.token).require_state(1);
    sess.state = 0;
    
    let reg_resp = JSON.parse(req.body.reg_resp);

    const result = u2f.checkRegistration(sess.ctx.reg_req, reg_resp);
    if(result.successful) {
        console.log(result);
        config.client_creds = {
            public_key: result.publicKey,
            key_handle: result.keyHandle
        };
        fs.writeFileSync(config.CLIENT_CREDS_FILE, JSON.stringify(config.client_creds));
        return resp.json({
            err: 0,
            msg: "OK"
        });
    }
    return resp.json({
        err: 1,
        msg: "Registration failed"
    });
}

export function request_login(req, resp) {
    let sess = Session.get(req.body.token).require_state(0).require_not_authorized();

    if(!config.client_creds) return resp.json({
        err: 1,
        msg: "client_creds not set"
    });

    let kh = config.client_creds.key_handle;
    sess.ctx = {
        auth_req: u2f.request(config.APP_ID, kh)
    };

    sess.state = 2;

    return resp.json({
        err: 0,
        msg: "OK",
        auth_req: sess.ctx.auth_req
    });
}

export function login_verify(req, resp) {
    let sess = Session.get(req.body.token).require_state(2);
    sess.state = 0;

    let pk = config.client_creds.public_key;
    let auth_resp = JSON.parse(req.body.auth_resp);

    let result = u2f.checkSignature(sess.ctx.auth_req, auth_resp, pk);

    sess.ctx = null;

    if(result.successful) {
        sess.authorized = true;
        return resp.json({
            err: 0,
            msg: "OK"
        });
    }

    return resp.json({
        err: 1,
        msg: "Verification failed"
    });
}
