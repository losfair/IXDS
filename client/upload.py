import requests
import base64
import sys
import os

svc_prefix = os.environ["IXDS_SVC_PREFIX"]
token = os.environ["IXDS_TOKEN"]

pkg_path = sys.argv[1]

with open(pkg_path, "rb") as f:
    pkg_data = f.read()

r = requests.post(svc_prefix + "/upload", data = base64.b64encode(pkg_data), headers = {
    "Token": token
}).json()

print(r)
