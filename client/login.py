import sys
import requests
import subprocess
import time
import json
import uuid
import config
import urllib.parse
import os
from u2flib_host import u2f, exc

dvc = u2f.list_devices()[0]
print(dvc)

svc_prefix = sys.argv[1]

req_id = str(uuid.uuid4())

params = urllib.parse.urlencode({
    "callback": svc_prefix + "/pre_auth/sso?req_id=" + req_id
})
sso_url = "https://oneidentity.me/web/?" + params + "#auth"

print(sso_url)

sess_token = None
while sess_token == None:
    r = requests.post(svc_prefix + "/pre_auth/get_session", data = {
        "req_id": req_id
    }).json()
    if r["err"] != 0:
        time.sleep(1)
        continue
    sess_token = r["token"]
    break

print("Requesting login")

login_req = requests.post(svc_prefix + "/auth/request_login", data = {
    "token": sess_token
}).json()
if login_req["err"] != 0:
    raise Exception(login_req["msg"])

auth_req = login_req["auth_req"]

print("Touch the button on your U2F key")

with dvc as dvc_ctx:
    ok = False
    while ok == False:
        try:
            auth_resp = u2f.authenticate(dvc_ctx, auth_req, config.APP_ID, False)
        except exc.APDUError:
            time.sleep(0.1)
            continue
        ok = True

print("Requesting verification")
    
r = requests.post(svc_prefix + "/auth/login_verify", data = {
    "token": sess_token,
    "auth_resp": json.dumps(auth_resp)
}).json()

if r["err"] != 0:
    raise Exception(r["msg"])

print("All done")
print("Token: " + sess_token)

os.environ["IXDS_SVC_PREFIX"] = svc_prefix
os.environ["IXDS_TOKEN"] = sess_token

subprocess.run("/bin/bash", shell = True)
