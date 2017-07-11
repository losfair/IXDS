import sys
import requests
import time
import json
import config
import urllib.parse
from u2flib_host import u2f, exc

dvc = u2f.list_devices()[0]
print(dvc)

svc_prefix = sys.argv[1]

params = urllib.parse.urlencode({
    "callback": svc_prefix + "/pre_auth/sso"
})
sso_url = "https://oneidentity.me/web/?" + params + "#auth"
print(sso_url)
sess_token = input("Token: ")

print("Requesting registration")

reg_req = requests.post(svc_prefix + "/auth/request_reg", data = {
    "token": sess_token
}).json()

print("Touch the button on your U2F key")

with dvc as dvc_ctx:
    ok = False
    while ok == False:
        try:
            reg_resp = u2f.register(dvc_ctx, reg_req, config.APP_ID)
        except exc.APDUError:
            time.sleep(0.1)
            continue
        ok = True

print("Verifying registration")

r = requests.post(svc_prefix + "/auth/verify_reg", data = {
    "token": sess_token,
    "reg_resp": json.dumps(reg_resp)
}).json()

if r["err"] != 0:
    raise Exception(r["msg"])