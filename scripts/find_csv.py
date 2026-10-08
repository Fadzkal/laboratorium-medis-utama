import os
import glob
import pandas as pd

paths = glob.glob("c:/lab_utama/**/*.csv", recursive=True)
for p in paths:
    size = os.path.getsize(p)
    print(f"{p} ({size:,} bytes)")
