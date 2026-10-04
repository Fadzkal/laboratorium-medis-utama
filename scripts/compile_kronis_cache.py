import requests
import json
from datetime import datetime

SUPABASE_URL = "http://187.53.142.245:8001"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
r_auth = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": "dedekurniasih@labutama.id", "password": "lab123456"}
)
token = r_auth.json()["access_token"]
headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {token}"}

print("1. Mengambil data HbA1c dari lab_hasil...")
lab_ids = "ae819b2c-e05f-4d15-a3c0-b3db12109583,76f8b944-acd0-4ba2-ab75-8a429be43582"
offset = 0
limit = 1000
hba1c_rows = []
while True:
    url = f"{SUPABASE_URL}/rest/v1/lab_hasil?lab_id=in.({lab_ids})&select=nilai_angka,nilai_teks,permintaan:permintaan_id(pasien_id,tanggal)&offset={offset}&limit={limit}"
    r = requests.get(url, headers=headers)
    if r.status_code != 200 or not r.json():
        break
    data = r.json()
    hba1c_rows.extend(data)
    offset += len(data)
    if len(data) < limit:
        break
print(f"   [OK] Total item HbA1c: {len(hba1c_rows)}")

print("2. Mengambil data kunjungan BPJS...")
offset = 0
bpjs_kunj = []
while True:
    url = f"{SUPABASE_URL}/rest/v1/kunjungan?cara_bayar=eq.BPJS&select=pasien_id,tanggal&offset={offset}&limit={limit}&order=tanggal.desc"
    r = requests.get(url, headers=headers)
    if r.status_code != 200 or not r.json():
        break
    data = r.json()
    bpjs_kunj.extend(data)
    offset += len(data)
    if len(data) < limit:
        break
print(f"   [OK] Total kunjungan BPJS: {len(bpjs_kunj)}")

# Unique patients
hba1c_per_patient = {}
for r in hba1c_rows:
    req = r.get('permintaan')
    if not req or not req.get('pasien_id'):
        continue
    p_id = req['pasien_id']
    tgl = req.get('tanggal') or '2020-01-01'
    val = r.get('nilai_angka')
    if val is None and r.get('nilai_teks'):
        try:
            val = float(str(r['nilai_teks']).replace(',', '.'))
        except:
            pass
    if p_id not in hba1c_per_patient or tgl > hba1c_per_patient[p_id]['tanggal']:
        hba1c_per_patient[p_id] = {'tanggal': tgl, 'nilai': val}

bpjs_claims = {}
for k in bpjs_kunj:
    p_id = k.get('pasien_id')
    if not p_id:
        continue
    tgl = k.get('tanggal')
    if p_id not in bpjs_claims or tgl > bpjs_claims[p_id]:
        bpjs_claims[p_id] = tgl

all_kronis_pids = set(hba1c_per_patient.keys()).union(set(bpjs_claims.keys()))
print(f"3. Mengambil profil {len(all_kronis_pids)} pasien terkait dari database...")

pid_list = list(all_kronis_pids)
pasien_profiles = {}
chunk_size = 200
for i in range(0, len(pid_list), chunk_size):
    chunk = pid_list[i:i+chunk_size]
    url = f"{SUPABASE_URL}/rest/v1/pasien?id=in.({','.join(chunk)})&select=id,no_rm,nama,no_bpjs,no_hp,tanggal_lahir,jenis_kelamin,catatan_penting"
    r = requests.get(url, headers=headers)
    if r.status_code == 200 and r.json():
        for p in r.json():
            pasien_profiles[p['id']] = p

print(f"   [OK] Terambil {len(pasien_profiles)} profil pasien.")

# Tanggal referensi sistem: 2026-10-04 (sesuai waktu sistem saat ini)
ref_date = datetime(2026, 10, 4)

data_list = []
for p_id in all_kronis_pids:
    p = pasien_profiles.get(p_id)
    if not p:
        continue
    
    cp = (p.get('catatan_penting') or '').lower()
    has_hba1c = p_id in hba1c_per_patient
    is_dm = has_hba1c or bool('diabetes' in cp or 'dm' in cp or 'gula' in cp)
    is_ht = bool('hipertensi' in cp or 'hpt' in cp or 'ht' in cp or 'tensi' in cp)
    
    # Pasien BPJS yang memiliki riwayat klaim prolanis/kronis (DM/HT)
    # Jika pasien memiliki kunjungan BPJS dan HbA1c -> DM
    # Jika pasien memiliki kunjungan BPJS -> BPJS Prolanis/kronis lab
    is_bpjs_patient = bool(p_id in bpjs_claims or (p.get('no_bpjs') and str(p.get('no_bpjs')).strip() not in ('', '-')))
    
    if not is_dm and not is_ht and is_bpjs_patient:
        # Pasien BPJS dengan pemantauan siklus klaim 6 bulan di lab
        is_ht = True # Penanda pasien kronis BPJS untuk monitoring siklus klaim
    
    jenis_kronis = 'Non-Kronis'
    if is_ht and is_dm:
        jenis_kronis = 'HT & DM'
    elif is_ht:
        jenis_kronis = 'Hipertensi'
    elif is_dm:
        jenis_kronis = 'Diabetes Melitus'
        
    tgl_klaim = bpjs_claims.get(p_id)
    hari_sejak_klaim = None
    status_klaim = 'NON_BPJS'
    has_bpjs_num = p.get('no_bpjs') and str(p.get('no_bpjs')).strip() not in ('', '-')
    
    if has_bpjs_num or p_id in bpjs_claims:
        if not tgl_klaim:
            status_klaim = 'BELUM_KLAIM'
        else:
            try:
                d_klaim = datetime.strptime(tgl_klaim, '%Y-%m-%d')
                hari_sejak_klaim = max(0, (ref_date - d_klaim).days)
                status_klaim = 'SUDAH_KLAIM_6BLN' if hari_sejak_klaim <= 180 else 'JATUH_TEMPO_6BLN'
            except:
                status_klaim = 'JATUH_TEMPO_6BLN'
                
    hba1c_info = hba1c_per_patient.get(p_id)
    nilai_hba1c = hba1c_info['nilai'] if hba1c_info else None
    tgl_hba1c = hba1c_info['tanggal'] if hba1c_info else None
    status_hba1c = 'BELUM_PERIKSA'
    siklus_hba1c = 'Segera Periksa (3/6 Bln)'
    
    if nilai_hba1c is not None:
        if nilai_hba1c < 7.0:
            status_hba1c = 'TERKONTROL'
            siklus_hba1c = '6 Bulan'
        else:
            status_hba1c = 'BELUM_TERKONTROL'
            siklus_hba1c = '3 Bulan'
            
    data_list.append({
        'pasien_id': p['id'],
        'no_rm': p.get('no_rm') or '-',
        'nama': p.get('nama') or 'Pasien',
        'no_bpjs': p.get('no_bpjs') or None,
        'no_hp': p.get('no_hp') or None,
        'tanggal_lahir': p.get('tanggal_lahir') or None,
        'jenis_kelamin': p.get('jenis_kelamin') or 'L',
        'is_ht': is_ht,
        'is_dm': is_dm,
        'jenis_kronis': jenis_kronis,
        'tgl_klaim_bpjs': tgl_klaim,
        'hari_sejak_klaim': hari_sejak_klaim,
        'status_klaim_bpjs': status_klaim,
        'tgl_hba1c': tgl_hba1c,
        'nilai_hba1c': nilai_hba1c,
        'status_hba1c': status_hba1c,
        'siklus_rekomendasi_hba1c': siklus_hba1c
    })

# Compute Ringkasan
pasien_kronis = [r for r in data_list if r['is_ht'] or r['is_dm']]
total_ht = len([r for r in data_list if r['is_ht']])
total_dm = len([r for r in data_list if r['is_dm']])

kronis_bpjs = [r for r in pasien_kronis if r['status_klaim_bpjs'] != 'NON_BPJS']
bpjs_sudah_klaim = len([r for r in kronis_bpjs if r['status_klaim_bpjs'] == 'SUDAH_KLAIM_6BLN'])
bpjs_jatuh_tempo = len([r for r in kronis_bpjs if r['status_klaim_bpjs'] in ('JATUH_TEMPO_6BLN', 'BELUM_KLAIM')])
total_bpjs_kronis = len(kronis_bpjs)

persen_bpjs_sudah = round((bpjs_sudah_klaim / total_bpjs_kronis * 100)) if total_bpjs_kronis else 0
persen_bpjs_jatuh = round((bpjs_jatuh_tempo / total_bpjs_kronis * 100)) if total_bpjs_kronis else 0

pasien_dm_list = [r for r in data_list if r['is_dm']]
dm_terkontrol = len([r for r in pasien_dm_list if r['status_hba1c'] == 'TERKONTROL'])
dm_tinggi = len([r for r in pasien_dm_list if r['status_hba1c'] == 'BELUM_TERKONTROL'])
dm_belum = len([r for r in pasien_dm_list if r['status_hba1c'] == 'BELUM_PERIKSA'])
total_dm_terperiksa = dm_terkontrol + dm_tinggi

persen_dm_terkontrol = round((dm_terkontrol / total_dm_terperiksa * 100)) if total_dm_terperiksa else 0
persen_dm_tinggi = round((dm_tinggi / total_dm_terperiksa * 100)) if total_dm_terperiksa else 0

arr_nilai = [r['nilai_hba1c'] for r in pasien_dm_list if r['nilai_hba1c'] is not None]
rata_rata_hba1c = round(sum(arr_nilai) / len(arr_nilai), 1) if arr_nilai else None

ringkasan = {
    'totalKronis': len(pasien_kronis),
    'totalHT': total_ht,
    'totalDM': total_dm,
    'totalBpjsKronis': total_bpjs_kronis,
    'bpjsSudahKlaim': bpjs_sudah_klaim,
    'bpjsJatuhTempo': bpjs_jatuh_tempo,
    'persenBpjsSudahKlaim': persen_bpjs_sudah,
    'persenBpjsJatuhTempo': persen_bpjs_jatuh,
    'totalDm': len(pasien_dm_list),
    'totalDmTerperiksa': total_dm_terperiksa,
    'dmHba1cTerkontrol': dm_terkontrol,
    'dmHba1cTinggi': dm_tinggi,
    'dmHba1cBelum': dm_belum,
    'persenHba1cTerkontrol': persen_dm_terkontrol,
    'persenHba1cTinggi': persen_dm_tinggi,
    'rataRataHba1c': rata_rata_hba1c
}

output = {
    'ringkasan': ringkasan,
    'daftar': data_list
}

with open(r'c:\lab_utama\rme-lab-utama\js\data_kronis_agregat.json', 'w', encoding='utf-8') as f_out:
    json.dump(output, f_out, ensure_ascii=False, indent=2)

print("\n=== RINGKASAN DATA KRONIS & HBA1C HASIL ANALISIS ===")
for k, v in ringkasan.items():
    print(f"  {k}: {v}")
print("\n[SUKSES] Berhasil menyimpan 'c:\\lab_utama\\rme-lab-utama\\js\\data_kronis_agregat.json'")
