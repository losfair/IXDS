const pre_auth = require("./pre_auth.js");
const auth = require("./auth.js");
const body_parser = require("body-parser");

export function init(app) {
    let bp = body_parser.urlencoded({
        extended: false
    });
    app.use(bp);

    app.get("/pre_auth/sso", wrap(pre_auth.sso));
    app.post("/auth/request_reg", wrap(auth.request_reg));
    app.post("/auth/verify_reg", wrap(auth.verify_reg));
    app.post("/auth/request_login", wrap(auth.request_login));
    app.post("/auth/login_verify", wrap(auth.login_verify));
}

function wrap(fn) {
    return async (req, resp) => {
        try {
            await fn(req, resp);
        } catch(e) {
            resp.json({
                err: -1,
                msg: "" + e
            });
        }
    }
}
