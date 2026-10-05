"""
Download REAL daily climate for Godagari from NASA POWER (no login needed) and write
src/data/climate_godagari.json in the format the app reads.

Parameters (community = AG):
  T2M_MAX      daily maximum air temperature at 2 m (°C)
  T2M_MIN      daily minimum air temperature at 2 m (°C)
  PRECTOTCORR  bias-corrected total precipitation (mm/day)

Usage:
  pip install requests
  python pipeline/fetch_power.py                      # Godagari upazila centre
  python pipeline/fetch_power.py --lat 24.47 --lon 88.40

Then rebuild the app:  npm run build
Docs: https://power.larc.nasa.gov/docs/
"""
import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "climate_godagari.json"
API = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMS = ["T2M_MAX", "T2M_MIN", "PRECTOTCORR"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, default=24.4667)   # Godagari upazila (Wikipedia coordinates)
    ap.add_argument("--lon", type=float, default=88.3306)
    ap.add_argument("--start", default="20001001")           # Oct 2000 so the 2001 Rabi season is complete
    ap.add_argument("--end", default="20251231")
    a = ap.parse_args()

    q = {
        "parameters": ",".join(PARAMS), "community": "AG",
        "latitude": a.lat, "longitude": a.lon,
        "start": a.start, "end": a.end, "format": "JSON",
    }
    print("Requesting NASA POWER ...")
    r = requests.get(API, params=q, timeout=300)
    r.raise_for_status()
    js = r.json()

    header = js.get("header", {})
    fill = header.get("fill_value", -999)
    p = js["properties"]["parameter"]

    start = datetime.strptime(a.start, "%Y%m%d").date()
    end = datetime.strptime(a.end, "%Y%m%d").date()
    keys, d = [], start
    while d <= end:
        keys.append(d.strftime("%Y%m%d"))
        d += timedelta(days=1)

    def series(name):
        vals, missing = [], 0
        for k in keys:
            v = p[name].get(k, fill)
            if v is None or v == fill or v <= -998:
                vals.append(None); missing += 1
            else:
                vals.append(round(float(v), 2))
        print(f"  {name}: {len(vals)} days, {missing} missing")
        return vals

    out = {
        "provenance": {
            "status": "REAL",
            "dataset": "NASA POWER daily point (community AG)",
            "version": (header.get("api") or {}).get("version", "unknown"),
            "parameters": {"tmax": "T2M_MAX °C", "tmin": "T2M_MIN °C", "prec": "PRECTOTCORR mm/day"},
            "lat": a.lat, "lon": a.lon,
            "start": start.isoformat(), "end": end.isoformat(),
            "retrieved": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "url": r.url,
            "sources": header.get("sources"),
            "notes": "Grid cell about 0.5° x 0.625°: an area-level signal, not a field measurement.",
        },
        "start": start.isoformat(),
        "tmax": series("T2M_MAX"),
        "tmin": series("T2M_MIN"),
        "prec": series("PRECTOTCORR"),
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT}  status=REAL")


if __name__ == "__main__":
    main()
