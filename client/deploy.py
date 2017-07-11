import requests
import base64
import sys
import os

svc_prefix = os.environ["IXDS_SVC_PREFIX"]
token = os.environ["IXDS_TOKEN"]

upload_id = sys.argv[1]
cfg_path = sys.argv[2]

with open(cfg_path, "r") as f:
    cfg_data = f.read()

r = requests.post(svc_prefix + "/deploy/request", data = {
    "token": token,
    "upload_id": upload_id,
    "config": cfg_data
}).json()

print(r)
