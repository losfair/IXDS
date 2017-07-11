import sys
import requests
import time
import json
import config
from u2flib_host import u2f, exc

dvc = u2f.list_devices()[0]
print(dvc)

svc_prefix = sys.argv[1]
sess_token = sys.argv[2]

login_req = requests.post(svc_prefix + "/auth/request_login", data = {
    "token": sess_token
}).json()
if login_req["err"] != 0:
    raise Exception(login_req["msg"])

auth_req = login_req["auth_req"]

with dvc as dvc_ctx:
    ok = False
    while ok == False:
        try:
            auth_resp = u2f.authenticate(dvc_ctx, auth_req, config.APP_ID, False)
        except exc.APDUError:
            time.sleep(0.1)
            continue
        ok = True
    
    r = requests.post(svc_prefix + "/auth/login_verify", data = {
        "token": sess_token,
        "auth_resp": json.dumps(auth_resp)
    }).json()
    print(r)
    