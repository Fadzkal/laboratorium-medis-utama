import csv
from collections import Counter

counter = Counter()
px_map = {}

with open("c:/lab_utama/hasil_lab_2026_lengkap_NIK_utuh_4332_pasien.csv", "r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.DictReader(f, delimiter=";")
    for row in reader:
        code = (row.get("rd_pxcode") or "").strip()
        name = (row.get("rd_pxname") or "").strip()
        val = (row.get("rd_value") or "").strip()
        unit = (row.get("rd_unit") or "").strip()
        if code and name:
            counter[(code, name)] += 1
            if code not in px_map:
                px_map[code] = {"name": name, "unit": unit, "sample_val": val}

print("\n--- TESTS 61 TO 130 IN 2026 DATA ---")
for (code, name), count in counter.most_common()[60:130]:
    info = px_map[code]
    print(f"Count: {count:4d} | Code: {code:12s} | Name: {name:32s} | Unit: {info['unit']}")
