import pandas as pd
from collections import Counter

# Read header and first few lines to detect delimiter
with open("c:/lab_utama/hasil_lab_2026_lengkap_NIK_utuh_4332_pasien.csv", "r", encoding="utf-8-sig", errors="replace") as f:
    for i in range(5):
        print(f.readline().strip())

df = pd.read_csv("c:/lab_utama/hasil_lab_2026_lengkap_NIK_utuh_4332_pasien.csv", nrows=1000, sep=None, engine='python')
print("\nColumns:", df.columns.tolist())
