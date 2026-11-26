import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime

# Target the production Choreo backend URL by default, or an override if provided
BACKEND_BASE_URL = os.environ.get(
    "BACKEND_API_BASE_URL",
    "https://a9a9815d-fed9-4f0e-bf6f-706f789df0f3-dev.e1-us-east-azure.choreoapis.dev/sts-admin-web/backend/v1.0"
).rstrip("/")

ENDPOINT_URL = f"{BACKEND_BASE_URL}/api/settlements/process-now"

def run_settlement():
    print(f"[{datetime.utcnow().isoformat()}Z] Starting automated daily settlement trigger...")
    print(f"Target URL: {ENDPOINT_URL}")

    req = urllib.request.Request(
        url=ENDPOINT_URL,
        data=b"{}",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Choreo-ScheduledTask-SettlementEngine/1.0"
        },
        method="POST"
    )

    try:
        # Timeout after 3 minutes if payout gateway processing takes time
        with urllib.request.urlopen(req, timeout=180) as response:
            status_code = response.status
            response_body = response.read().decode("utf-8")

            print(f"[{datetime.utcnow().isoformat()}Z] Settlement run completed successfully! HTTP Status: {status_code}")
            try:
                parsed_json = json.loads(response_body)
                print(f"Response: {json.dumps(parsed_json, indent=2)}")
            except Exception:
                print(f"Raw Response: {response_body}")

            sys.exit(0)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        print(f"[{datetime.utcnow().isoformat()}Z] Settlement API returned HTTP {e.code}: {e.reason}", file=sys.stderr)
        print(f"Response details: {error_body}", file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(f"[{datetime.utcnow().isoformat()}Z] Unexpected failure connecting to settlement API: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_settlement()
