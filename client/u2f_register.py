import sys
import requests
import time
import json
import config
from u2flib_host import u2f, exc

dvc = u2f.list_devices()[0]
print(dvc)

svc_prefix = sys.argv[1]
pre_auth_token = sys.argv[2]

reg_req = requests.post(svc_prefix + "/auth/request_reg", data = {
    "token": pre_auth_token
}).json()

print(reg_req)

with dvc as dvc_ctx:
    ok = False
    while ok == False:
        try:
            reg_resp = u2f.register(dvc_ctx, reg_req, config.APP_ID)
        except exc.APDUError:
            time.sleep(0.1)
            continue
        ok = True

    print(reg_resp)

    r = requests.post(svc_prefix + "/auth/verify_reg", data = {
        "token": pre_auth_token,
        "reg_resp": json.dumps(reg_resp)
    }).json()

    if r["err"] != 0:
        raise Exception(r["msg"])