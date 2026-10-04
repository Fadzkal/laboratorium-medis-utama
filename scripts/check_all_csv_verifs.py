import csv
from collections import Counter
import glob

files = glob.glob(r"c:\lab_utama\hasil_lab_*.csv")
for fpath in sorted(files):
    fname = fpath.split('\\')[-1]
    with open(fpath, "r", encoding="utf-8-sig", errors="ignore") as f:
        # read first line
        first_line = f.readline()
        delimiter = ';' if ';' in first_line else ','
        f.seek(0)
        reader = csv.DictReader(f, delimiter=delimiter)
        verif_col = None
        for col in reader.fieldnames:
            if 'verif' in col.lower() or 'petugas' in col.lower() or 'analis' in col.lower():
                verif_col = col
                break
        
        counter = Counter()
        row_cnt = 0
        for r in reader:
            row_cnt += 1
            if verif_col:
                val = (r.get(verif_col) or '').strip(' "\'')
                if val:
                    counter[val] += 1
        print(f"=== {fname} (rows: {row_cnt}, verif_col: {verif_col}) ===")
        print(counter.most_common(5))
