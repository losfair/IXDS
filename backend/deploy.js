const cp = require("child_process");
const cpp = require("child-process-promise");
const config = require("./config.js");
const upload = require("./upload.js");
const path = require("path");
const fs = require("fs");
import Session from "./Session.js";

export async function request_deploy(req, resp) {
    console.log("Deploy request from user " + req.session.user_id);

    let upload_id = req.body.upload_id
    let upload_root = upload.uploads[upload_id]

    if(!upload_root) {
        throw new Error("Invalid upload_id");
    }

    let deploy_config = JSON.parse(req.body.config);

    if(!check_pkg_name(deploy_config.upload_name)) {
        throw new Error("Invalid upload_name");
    }

    if(!check_pkg_name(deploy_config.deploy_name)) {
        throw new Error("Invalid deploy_name");
    }

    let upload_pkg_path = path.normalize(path.join(upload_root, deploy_config.upload_name));
    if(!upload_pkg_path.startsWith(upload_root + "/")) throw new Error("Invalid upload_name");

    let deploy_path = path.normalize(path.join(config.DEPLOY_DIR, deploy_config.deploy_name));
    if(!deploy_path.startsWith(config.DEPLOY_DIR + "/")) throw new Error("Invalid deploy_name");

    console.log("Deploying " + upload_pkg_path + " to " + deploy_path);

    await cpp.execFile("rm", ["-rf", deploy_path]);
    let cp_result = await cpp.execFile("cp", ["-r", upload_pkg_path, deploy_path]);
    if(cp_result.error) {
        throw cp_result.error;
    }

    console.log("Deployment done");

    if(deploy_config.daemon_mode) {
        let dm = deploy_config.daemon_mode;
        let entry = deploy_config.entry;

        if(!entry) throw new Error("Entry required");

        let daemon_user = deploy_config.user || "root";
        let daemon_group = deploy_config.group || "root";

        console.log("daemon_mode: " + dm);
        switch(dm) {
            case "supervisor": {
                let cfg = generate_supervisor_cfg({
                    deploy_path: deploy_path,
                    deploy_name: deploy_config.deploy_name,
                    entry: entry,
                    user: daemon_user,
                    group: daemon_group
                });
                fs.writeFileSync("/etc/supervisor/conf.d/" + deploy_config.deploy_name + ".conf", cfg);
                break;
            }

            default:
                throw new Error("Unknown daemon_mode");
        }
    }

    resp.json({
        err: 0,
        msg: "OK"
    });
}

function check_pkg_name(name) {
    if(typeof(name) != "string") return false;
    if(!name.length) return false;

    for(let i = 0; i < name.length; i++) {
        if(
            !(name[i] >= 'A' && name[i] <= 'Z')
            && !(name[i] >= 'a' && name[i] <= 'z')
            && !(name[i] >= '0' && name[i] <= '9')
            && name[i] != '-'
            && name[i] != '_'
        ) {
            return false;
        }
    }
    return true;
}

function generate_supervisor_cfg({ deploy_path, deploy_name, entry, user, group }) {
    return `
[program:${deploy_name}]
command=${entry}
directory=${deploy_path}
autostart=true
autorestart=true
user=${user}
group=${group}
    `.trim() + "\n";
}
