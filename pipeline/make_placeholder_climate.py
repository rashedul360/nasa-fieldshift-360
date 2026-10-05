"""
Generate a PLACEHOLDER daily climate file so the app runs before real NASA data is downloaded.

IMPORTANT: this is NOT NASA data. It is a synthetic, *stationary* weather series
(no trend added on purpose) shaped roughly like Rajshahi's seasonal cycle.
The app shows a red "PLACEHOLDER" banner while this file is in use.
Replace it with real data:  python pipeline/fetch_power.py

Usage:  python pipeline/make_placeholder_climate.py
"""
import json
import math
import random
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "climate_godagari.json"
START, END = date(2000, 10, 1), date(2025, 12, 31)

# Rough monthly shape for north-west Bangladesh (approximate, for placeholder only)
TMAX = [24.5, 28.0, 33.0, 36.0, 35.0, 33.0, 32.0, 32.0, 32.0, 31.0, 28.5, 25.5]
TMIN = [11.0, 13.5, 18.0, 23.0, 25.0, 26.0, 26.0, 26.0, 25.0, 22.0, 16.0, 12.0]
RAIN_MM = [9, 13, 20, 55, 140, 270, 320, 280, 250, 110, 12, 5]
WET_DAYS = [1, 2, 2, 5, 10, 16, 20, 18, 15, 6, 1, 1]


def main() -> None:
    rnd = random.Random(2026)
    tmax, tmin, prec = [], [], []
    d, anom = START, 0.0
    while d <= END:
        m = d.month - 1
        anom = 0.7 * anom + rnd.gauss(0, 1.3)          # day-to-day persistence
        tmax.append(round(TMAX[m] + anom, 1))
        tmin.append(round(TMIN[m] + 0.6 * anom + rnd.gauss(0, 0.6), 1))
        days_in_month = 30
        p_wet = WET_DAYS[m] / days_in_month
        if rnd.random() < p_wet:
            mean_amt = RAIN_MM[m] / max(WET_DAYS[m], 1)
            prec.append(round(rnd.expovariate(1 / mean_amt), 1))
        else:
            prec.append(0.0)
        d += timedelta(days=1)

    out = {
        "provenance": {
            "status": "PLACEHOLDER",
            "dataset": "Synthetic placeholder (NOT NASA data)",
            "version": "placeholder-1",
            "parameters": {"tmax": "°C", "tmin": "°C", "prec": "mm/day"},
            "lat": 24.4667, "lon": 88.3306,
            "start": START.isoformat(), "end": END.isoformat(),
            "retrieved": None, "url": None,
            "notes": "Stationary synthetic series with no trend. Run pipeline/fetch_power.py to replace with NASA POWER.",
        },
        "start": START.isoformat(),
        "tmax": tmax, "tmin": tmin, "prec": prec,
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT} ({len(tmax)} days, PLACEHOLDER)")


if __name__ == "__main__":
    main()
