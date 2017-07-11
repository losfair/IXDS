const uuid = require("uuid");

export default class Session {
    constructor(user_id) {
        this.id = uuid.v4();
        this.state = 0;
        this.authorized = false;
        this.user_id = user_id;
        this.ctx = null;
        this.create_time = Date.now();
    }

    destroy() {
        delete sessions[this.id];
    }

    require_state(state) {
        if(this.state != state) {
            throw new Error("Invalid session state");
        }
        return this;
    }

    require_authorized() {
        if(!this.authorized) {
            throw new Error("Not authorized");
        }
        return this;
    }

    require_not_authorized() {
        if(this.authorized) {
            throw new Error("Already authorized");
        }
        return this;
    }

    static create(user_id) {
        let sess = new Session(user_id);
        sessions[sess.id] = sess;
        return sess;
    }

    static get(id) {
        if(!sessions[id]) {
            throw new Error("Session not found");
        }
        let sess = sessions[id];
        if(Date.now() - sess.create_time > 300000) {
            sess.destroy();
            throw new Error("Session expired");
        }

        return sess;
    }
}

let sessions = {};
