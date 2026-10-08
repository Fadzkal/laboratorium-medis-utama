import csv

with open("c:/lab_utama/rme-lab-utama/data/master_pemeriksaan_skylab.csv", "r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.reader(f, delimiter=";")
    header = next(reader)
    print("Header:", header)
    for r in reader:
        if len(r) > 2 and any(k in r[0] for k in ["H0101", "H0102", "U01", "I02", "K03"]):
            code = r[0]
            name = r[2]
            loinc = r[3] if len(r) > 3 else ""
            disp = r[4] if len(r) > 4 else ""
            spec_c = r[5] if len(r) > 5 else ""
            spec_n = r[6] if len(r) > 6 else ""
            if any(term in name.lower() for term in ["hemoglobin", "leukosit", "eritrosit", "trombosit", "hematokrit", "kolesterol", "glukosa", "asam urat", "ureum", "kreatinin", "sgot", "sgpt", "urin"]):
                print(f"{code:12s} | {name:30s} | LOINC: {repr(loinc):15s} | Disp: {disp[:25]} | Spec: {spec_c} {spec_n}")
