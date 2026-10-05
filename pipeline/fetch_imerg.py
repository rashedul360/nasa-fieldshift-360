"""
OPTIONAL upgrade: replace the rainfall series with NASA GPM IMERG V07 Final daily
(short name GPM_3IMERGDF) at the nearest 0.1° grid cell.

Status: written for the team, NOT tested in the build environment (no NASA access there).
Needs a free NASA Earthdata login (https://urs.earthdata.nasa.gov).

  pip install earthaccess xarray h5netcdf numpy
  python pipeline/fetch_imerg.py            # reads files remotely, only the needed chunks
  npm run build

It keeps temperature from fetch_power.py and swaps "prec" for IMERG, updating provenance.
Note: about 9,200 daily files; expect this to take a while. IMERG Final arrives ~3.5 months late,
so it is used for history only.
"""
import json
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "climate_godagari.json"


def main(lat: float = 24.4667, lon: float = 88.3306) -> None:
    import earthaccess
    import numpy as np
    import xarray as xr

    clim = json.loads(OUT.read_text())
    if clim["provenance"]["status"] != "REAL":
        raise SystemExit("Run fetch_power.py first so temperature is real.")
    start = date.fromisoformat(clim["start"])
    n = len(clim["tmax"])
    end = start + timedelta(days=n - 1)

    earthaccess.login()
    results = earthaccess.search_data(
        short_name="GPM_3IMERGDF", version="07",
        temporal=(start.isoformat(), end.isoformat()),
        bounding_box=(lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1),
    )
    print(f"{len(results)} granules")
    files = earthaccess.open(results)
    by_day = {}
    for f in files:
        ds = xr.open_dataset(f, engine="h5netcdf")
        v = ds["precipitation"].sel(lat=lat, lon=lon, method="nearest")
        t = np.datetime_as_string(ds["time"].values[0], unit="D")
        by_day[t] = float(np.asarray(v).squeeze())
        ds.close()

    prec, d = [], start
    while d <= end:
        val = by_day.get(d.isoformat())
        prec.append(None if val is None or val < 0 else round(val, 2))
        d += timedelta(days=1)

    clim["prec"] = prec
    pv = clim["provenance"]
    pv["parameters"]["prec"] = "GPM IMERG V07 Final daily precipitation mm/day"
    pv["dataset"] = pv["dataset"] + " + GPM IMERG V07 Final (rain)"
    pv["notes"] = pv.get("notes", "") + " Rain from IMERG 0.1° nearest cell."
    OUT.write_text(json.dumps(clim, separators=(",", ":")))
    print("rain replaced with IMERG")


if __name__ == "__main__":
    main()
