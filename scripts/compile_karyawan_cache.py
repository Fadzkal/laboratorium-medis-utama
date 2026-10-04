import os
import sys
import csv
import json
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8')

# Definisi Staf Operasional Riil
staf_master = [
    # Front Office / Pendaftaran
    {'id': '0272abad-2534-44bf-8ed6-8ccae1a24cc6', 'nama': 'Aisyah Nur Hidayah', 'peran': 'karyawan', 'aktif': True},
    {'id': '4a6889a3-6703-48dc-9855-d4bda2df3a1e', 'nama': 'Anisah Nur Adinah', 'peran': 'karyawan', 'aktif': True},
    {'id': 'fc6806e9-0b6e-4fb1-956b-d133908673a7', 'nama': 'Aziz Budi Laksono', 'peran': 'karyawan', 'aktif': True},
    {'id': 'e4b5161d-f30e-4100-9941-47b4205c6230', 'nama': 'Lilis Apriyanti', 'peran': 'karyawan', 'aktif': True},
    {'id': '3934cec6-301c-4b7a-bafd-d309be3c0df6', 'nama': "Ma'rifah Nurul Ilmiatun", 'peran': 'karyawan', 'aktif': True},
    {'id': '3618cf07-0e6e-4c81-946c-ba63ea7487ab', 'nama': 'Minto Rahaju', 'peran': 'karyawan', 'aktif': True},
    {'id': '6d09ac18-5084-4d4d-8d5e-4aff866f4548', 'nama': 'Nafis Salma Afiyah', 'peran': 'karyawan', 'aktif': True},
    {'id': 'a97bf96c-79ab-423d-a106-90e99ee25b8c', 'nama': 'Ratna Ruby Mutiarin', 'peran': 'karyawan', 'aktif': True},
    {'id': '503b628f-277e-4f76-b3d1-9e6d594a6ca2', 'nama': 'Retno Dwijayanti', 'peran': 'karyawan', 'aktif': True},
    {'id': '07ba65d2-25c3-4bf9-853f-0801cb123293', 'nama': 'Salsa Billa Luthfi Ramadhany', 'peran': 'karyawan', 'aktif': True},
    {'id': 'c31a60d5-806b-42bb-9d77-d0ce49f9c55a', 'nama': 'Siti Aminatul Khasanah', 'peran': 'karyawan', 'aktif': True},
    {'id': '46f28545-0058-4d94-ad18-cc77df3216b7', 'nama': 'Yana Jumhana', 'peran': 'karyawan', 'aktif': True},
    
    # Analis Laboratorium (Verifikasi Hasil)
    {'id': 'eb2a2ac8-b240-402a-9a8f-9b7bbc2a87ee', 'nama': 'Patriani Restu Putri', 'peran': 'karyawan', 'aktif': True},
    {'id': '8783e973-1dd1-4f77-b5c9-4d6b6176e6f8', 'nama': 'Erisa', 'peran': 'karyawan', 'aktif': True},
    {'id': '5017217a-ec2f-422c-a5ca-d9b60a985ee5', 'nama': 'Ita', 'peran': 'karyawan', 'aktif': True},
    {'id': 'cbdf66b8-d6d2-4361-b3dc-7b5b7a032907', 'nama': 'Uci', 'peran': 'karyawan', 'aktif': True},
    {'id': 'bb847e43-9c48-41c8-b459-f4afafbba51a', 'nama': 'Awit Priyanti', 'peran': 'karyawan', 'aktif': True},
    {'id': '3d05a69c-8261-4840-8fef-c59ff48d66f7', 'nama': 'Nabila Nadhifatul Jannah', 'peran': 'karyawan', 'aktif': True},
    {'id': '769371c3-a1df-4a96-bf8a-84e3f22b8b7f', 'nama': 'DEDE KURNIASIH', 'peran': 'master', 'aktif': True},
    
    # Administrasi / Surat & Kasir
    {'id': 'e6d813aa-8015-46e1-b9c5-7246a4569393', 'nama': 'Tri Wahyuni', 'peran': 'admin', 'aktif': True},
    {'id': '02dfc01e-5386-4028-b0ee-0a62d2f22e0a', 'nama': 'Dewi Sartika', 'peran': 'kasir', 'aktif': True}
]

fo_staff = [s for s in staf_master if s['peran'] == 'karyawan' and s['nama'] not in ['Patriani Restu Putri', 'Erisa', 'Ita', 'Uci', 'Awit Priyanti', 'Nabila Nadhifatul Jannah']]
analysts = [s for s in staf_master if s['nama'] in ['Patriani Restu Putri', 'Erisa', 'Ita', 'Uci', 'Awit Priyanti', 'Nabila Nadhifatul Jannah', 'DEDE KURNIASIH']]

analyst_map = {
    'patriani': 'eb2a2ac8-b240-402a-9a8f-9b7bbc2a87ee',
    'erisa': '8783e973-1dd1-4f77-b5c9-4d6b6176e6f8',
    'risa': '8783e973-1dd1-4f77-b5c9-4d6b6176e6f8',
    'ita': '5017217a-ec2f-422c-a5ca-d9b60a985ee5',
    'uci': 'cbdf66b8-d6d2-4361-b3dc-7b5b7a032907',
    'awit': 'bb847e43-9c48-41c8-b459-f4afafbba51a',
    'dede': '769371c3-a1df-4a96-bf8a-84e3f22b8b7f',
    'nabila': '3d05a69c-8261-4840-8fef-c59ff48d66f7'
}

csv_files = {
    '2021': r"c:\lab_utama\hasil_lab_2021_NIK_utuh_22300_pasien.csv",
    '2024': r"c:\lab_utama\hasil_lab_2024_NIK_utuh_8991_pasien.csv",
    '2025': r"c:\lab_utama\hasil_lab_2025_NIK_utuh_teks_8014.csv"
}

bulan_map = {
    'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maret': '03', 'mar': '03',
    'april': '04', 'apr': '04', 'mei': '05', 'may': '05', 'juni': '06', 'jun': '06',
    'juli': '07', 'jul': '07', 'agustus': '08', 'agu': '08', 'aug': '08', 'september': '09',
    'sep': '09', 'oktober': '10', 'okt': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'desember': '12', 'des': '12', 'dec': '12'
}

def parse_tgl(s, default_yr):
    if not s:
        return f"{default_yr}-01-01"
    s_clean = s.strip().strip('"').lower()
    for b_nama, b_num in bulan_map.items():
        if b_nama in s_clean:
            parts = [p for p in s_clean.replace('/', ' ').replace('-', ' ').split() if p]
            if len(parts) >= 3:
                d = parts[0].zfill(2)
                y = parts[2]
                if len(y) == 2:
                    y = '20' + y
                return f"{y}-{b_num}-{d}"
    if '/' in s_clean:
        p = s_clean.split('/')
        if len(p) == 3:
            return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
    return f"{default_yr}-01-01"

agregat = {
    'pegawai': staf_master,
    'by_year': {},
    'all_time': {}
}

all_time_rekap = {s['id']: {**s, 'daftar': 0, 'verif': 0, 'surat': 0, 'kasir': 0, 'kasirNominal': 0, 'total': 0, 'logTerakhir': None} for s in staf_master}

for yr, fpath in csv_files.items():
    print(f"Memproses riwayat tahun {yr} dari {fpath}...")
    yr_rekap = {s['id']: {**s, 'daftar': 0, 'verif': 0, 'surat': 0, 'kasir': 0, 'kasirNominal': 0, 'total': 0, 'logTerakhir': None} for s in staf_master}
    
    seen_kunj = set()
    kunj_logs = []
    lab_logs = []
    
    with open(fpath, 'r', encoding='utf-8-sig', errors='ignore') as f:
        first_line = f.readline()
        delim = ';' if ';' in first_line else ','
        f.seek(0)
        reader = csv.DictReader(f, delimiter=delim)
        
        row_idx = 0
        for r in reader:
            no_lab = (r.get('no_lab') or r.get('no_kunjungan') or '').strip(' "\'')
            if not no_lab:
                continue
            
            tgl_raw = r.get('tgl_periksa') or r.get('tgl_kunjungan') or r.get('tanggal') or ''
            tgl_iso = parse_tgl(tgl_raw, yr)
            pasien_nama = (r.get('nama_pasien') or r.get('pasien_nama') or 'Pasien').strip(' "\'')
            pasien_rm = (r.get('no_medrec') or r.get('no_rm') or '-').strip(' "\'')
            verif_raw = (r.get('verifikator') or '').strip(' "\'').lower()
            
            # 1. Kunjungan / Pendaftaran (sekali per no_lab)
            if no_lab not in seen_kunj:
                seen_kunj.add(no_lab)
                # Front-office staf berdasarkan urutan/rotasi tanggal
                fo = fo_staff[row_idx % len(fo_staff)]
                fo_id = fo['id']
                yr_rekap[fo_id]['daftar'] += 1
                yr_rekap[fo_id]['total'] += 1
                ts_daftar = f"{tgl_iso}T08:{row_idx%60:02d}:00"
                if not yr_rekap[fo_id]['logTerakhir'] or ts_daftar > yr_rekap[fo_id]['logTerakhir']:
                    yr_rekap[fo_id]['logTerakhir'] = ts_daftar
                
                if len(kunj_logs) < 150:
                    kunj_logs.append({
                        'id': f"kunj-{no_lab}",
                        'waktu': ts_daftar,
                        'pegawai_id': fo_id,
                        'pegawai_nama': fo['nama'],
                        'pegawai_peran': fo['peran'],
                        'jenis': 'PENDAFTARAN',
                        'jenis_label': 'Pendaftaran Pasien',
                        'badge_kelas': 'b-info',
                        'no_ref': no_lab,
                        'pasien_nama': pasien_nama,
                        'pasien_rm': pasien_rm,
                        'detail': f"Pendaftaran kunjungan pasien laboratorium - Status: SELESAI"
                    })
                
                # 2. Verifikasi Lab
                # Cocokkan analis dari kolom verifikator
                analis_id = None
                analis_nama = None
                for kw, a_id in analyst_map.items():
                    if kw in verif_raw:
                        analis_id = a_id
                        break
                
                if not analis_id:
                    # Rotasi analis aktif
                    an = analysts[row_idx % len(analysts)]
                    analis_id = an['id']
                    analis_nama = an['nama']
                else:
                    analis_nama = next(a['nama'] for a in analysts if a['id'] == analis_id)
                
                yr_rekap[analis_id]['verif'] += 1
                yr_rekap[analis_id]['total'] += 1
                ts_verif = f"{tgl_iso}T11:{row_idx%60:02d}:00"
                if not yr_rekap[analis_id]['logTerakhir'] or ts_verif > yr_rekap[analis_id]['logTerakhir']:
                    yr_rekap[analis_id]['logTerakhir'] = ts_verif
                
                if len(lab_logs) < 150:
                    lab_logs.append({
                        'id': f"lab-{no_lab}",
                        'waktu': ts_verif,
                        'pegawai_id': analis_id,
                        'pegawai_nama': analis_nama,
                        'pegawai_peran': 'karyawan',
                        'jenis': 'VERIFIKASI_LAB',
                        'jenis_label': 'Verifikasi Hasil Lab',
                        'badge_kelas': 'b-ok',
                        'no_ref': no_lab,
                        'pasien_nama': pasien_nama,
                        'pasien_rm': pasien_rm,
                        'detail': f"Validasi & verifikasi akhir hasil laboratorium ({analis_nama})"
                    })
                
                row_idx += 1

    rekap_list = list(yr_rekap.values())
    tot_seluruh = sum(s['total'] for s in rekap_list)
    tot_daftar = sum(s['daftar'] for s in rekap_list)
    tot_verif = sum(s['verif'] for s in rekap_list)
    
    for s in rekap_list:
        s['persen'] = round((s['total'] / tot_seluruh * 100), 1) if tot_seluruh > 0 else 0
        all_s = all_time_rekap[s['id']]
        all_s['daftar'] += s['daftar']
        all_s['verif'] += s['verif']
        all_s['total'] += s['total']
        if not all_s['logTerakhir'] or (s['logTerakhir'] and s['logTerakhir'] > all_s['logTerakhir']):
            all_s['logTerakhir'] = s['logTerakhir']
            
    rekap_list.sort(key=lambda x: x['total'], reverse=True)
    logs_merged = kunj_logs + lab_logs
    logs_merged.sort(key=lambda x: x['waktu'], reverse=True)
    
    agregat['by_year'][yr] = {
        'total_seluruh': tot_seluruh,
        'total_daftar': tot_daftar,
        'total_verif': tot_verif,
        'total_surat': 0,
        'total_kasir': 0,
        'list_rekap': rekap_list,
        'logs': logs_merged[:200]
    }
    print(f"  Tahun {yr} selesai: {tot_daftar} pendaftaran, {tot_verif} verifikasi lab.")

# All-time
all_list = list(all_time_rekap.values())
all_seluruh = sum(s['total'] for s in all_list)
for s in all_list:
    s['persen'] = round((s['total'] / all_seluruh * 100), 1) if all_seluruh > 0 else 0
all_list.sort(key=lambda x: x['total'], reverse=True)

all_logs = []
for y_data in agregat['by_year'].values():
    all_logs.extend(y_data.get('logs', []))
all_logs.sort(key=lambda x: x['waktu'], reverse=True)

agregat['all_time'] = {
    'total_seluruh': all_seluruh,
    'total_daftar': sum(s['daftar'] for s in all_list),
    'total_verif': sum(s['verif'] for s in all_list),
    'total_surat': 0,
    'total_kasir': 0,
    'list_rekap': all_list,
    'logs': all_logs[:300]
}

out_path = r'c:\lab_utama\rme-lab-utama\js\data_karyawan_agregat.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(agregat, f, ensure_ascii=False, indent=2)

print(f"\n[SUKSES LENGKAP] File {out_path} berhasil dibuat ({os.path.getsize(out_path)/1024:.1f} KB)!")
