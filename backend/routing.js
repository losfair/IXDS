const pre_auth = require("./pre_auth.js");
const auth = require("./auth.js");
const body_parser = require("body-parser");
const upload = require("./upload.js");
const deploy = require("./deploy.js");

export function init(app) {
    let bp = body_parser.urlencoded({
        extended: false
    });
    app.use("/pre_auth/", bp);
    app.use("/auth/", bp);
    app.use("/deploy", bp)

    app.get("/pre_auth/sso", wrap(pre_auth.sso));
    app.post("/pre_auth/get_session", wrap(pre_auth.get_session));
    app.post("/auth/request_reg", wrap(auth.request_reg));
    app.post("/auth/verify_reg", wrap(auth.verify_reg));
    app.post("/auth/request_login", wrap(auth.request_login));
    app.post("/auth/login_verify", wrap(auth.login_verify));

    app.use("/upload", upload.handle_upload);
    app.post("/upload", wrap(upload.handle_end));

    app.use("/deploy/", auth.require_authorized);
    app.post("/deploy/request", wrap(deploy.request_deploy));
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
