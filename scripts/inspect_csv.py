import pandas as pd

df1 = pd.read_csv("c:/lab_utama/data_nilai_normal_lab_771 rapi.csv")
print("Columns in data_nilai_normal_lab_771 rapi.csv:")
print(df1.columns.tolist())
print("\nSample rows:")
print(df1.head(5))

df2 = pd.read_csv("c:/lab_utama/rme-lab-utama/data/master_pemeriksaan_skylab.csv")
print("\nColumns in master_pemeriksaan_skylab.csv:")
print(df2.columns.tolist())
print("\nSample rows:")
print(df2.head(5))
