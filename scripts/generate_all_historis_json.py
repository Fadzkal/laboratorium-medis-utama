"""
================================================================================
GENERATOR AGREGAT DATA HISTORIS LENGKAP (2019, 2020, 2021, 2022, 2023)
LABORATORIUM MEDIS UTAMA PURBALINGGA
================================================================================
Memproses seluruh baris CSV 2019 - 2023:
- 2019:  9.248 registrasi
- 2020: 10.614 registrasi
- 2021: 22.300 registrasi
- 2022: 13.918 registrasi
- 2023:  9.175 registrasi
Total:  65.255 registrasi kunjungan dan ratusan ribu parameter laboratorium
================================================================================
"""

import os
import sys
import json
import csv
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8')

def tentukan_kelompok(px_name):
    p = px_name.lower()
    if any(x in p for x in ['sars', 'covid', 'antigen', 'pcr', 'swab', 'widal', 'hbsag', 'hiv', 'dengue', 'ns1', 'igg', 'igm', 'tpha', 'vdrl', 'crp', 'anti', 'typhi', 'salmonella', 'hbeag', 'troponin', 'serologi']):
        return 'Imunoserologi'
    if any(x in p for x in ['leukosit', 'eritrosit', 'hemoglobin', 'hematokrit', 'trombosit', 'limfosit', 'monosit', 'eosinofil', 'basofil', 'segmen', 'batang', 'led', 'darah lengkap', 'hematologi', 'mcv', 'mch', 'mchc', 'golongan darah', 'morfologi', 'hitung jenis', 'd-dimer', 'hemostasis', 'pt', 'aptt', 'inr', 'fibrinogen', 'retikulosit', 'bt', 'ct']):
        return 'Hematologi'
    if any(x in p for x in ['glukosa', 'gula', 'kolesterol', 'cholesterol', 'trigliserida', 'triglyceride', 'hdl', 'ldl', 'asam urat', 'uric', 'ureum', 'urea', 'kreatinin', 'creatinin', 'sgot', 'sgpt', 'alt', 'ast', 'bilirubin', 'protein total', 'albumin', 'globulin', 'hba1c', 'gamma gt', 'alp', 'elektrolit', 'natrium', 'kalium', 'klorida', 'kalsium']):
        return 'Kimia Klinik'
    if any(x in p for x in ['urin', 'urine', 'sedimen', 'reduksi', 'protein urin', 'feses', 'tinja', 'warna', 'kejernihan', 'berat jenis', 'bj', 'ph', 'nitrit', 'urobilinogen', 'keton', 'silinder', 'epitel', 'kristal', 'bakteri', 'hyaline', 'granular', 'jamur']):
        return 'Urinalisa & Feses'
    if any(x in p for x in ['jaringan', 'pa ', 'sitologi', 'fnab', 'biopsi', 'pap smear', 'kultur']):
        return 'Patologi Anatomi'
    if any(x in p for x in ['thorax', 'rontgen', 'x-ray', 'ekg', 'usg', 'audiometri', 'spirometri', 'treadmill']):
        return 'Radiologi & Penunjang'
    if any(x in p for x in ['fisik', 'gigi', 'visus', 'buta warna', 'tekanan darah', 'berat badan', 'tinggi badan', 'bmi', 'imt']):
        return 'Pemeriksaan Fisik'
    return 'Lainnya'

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
                    y = ('19' if int(y) > 30 else '20') + y
                if not y.isdigit() or len(y) != 4:
                    y = default_yr
                return f"{y}-{b_num}-{d}"
    return f"{default_yr}-01-01"

csv_files = [
    ("2019", r"c:\lab_utama\hasil_lab_2019_NIK_utuh_9248_pasien.csv"),
    ("2020", r"c:\lab_utama\hasil_lab_2020_NIK_utuh_10614_pasien.csv"),
    ("2021", r"c:\lab_utama\hasil_lab_2021_NIK_utuh_22300_pasien.csv"),
    ("2022", r"c:\lab_utama\hasil_lab_2022_NIK_utuh_13918_pasien.csv"),
    ("2023", r"c:\lab_utama\hasil_lab_2023_NIK_utuh_9175_pasien.csv"),
    ("2024", r"c:\lab_utama\hasil_lab_2024_NIK_utuh_8991_pasien.csv"),
    ("2025", r"c:\lab_utama\hasil_lab_2025_NIK_utuh_teks_8014.csv"),
    ("2026", r"c:\lab_utama\hasil_lab_2026_lengkap_NIK_utuh_4332_pasien.csv"),
]

data_by_year = {}

# Global aggregators across all years
global_visits = set()
global_px_counter = Counter()
global_dokter_visits = defaultdict(set)
global_dokter_px = defaultdict(Counter)
global_instansi_visits = defaultdict(set)
global_instansi_px = defaultdict(Counter)
global_per_tahun = defaultdict(lambda: {'kunjungan': 0, 'total_tes': 0, 'bpjs': 0, 'umum': 0})
global_hourly_visits = Counter()

for yr, path in csv_files:
    print(f"\nMemproses CSV {yr}: {os.path.basename(path)}...")
    if not os.path.exists(path):
        print(f"  [ERR] File tidak ditemukan: {path}")
        continue

    all_px_counter = Counter()
    px_kelompok_map = {}
    dokter_visits = defaultdict(set)
    dokter_px = defaultdict(Counter)
    instansi_visits = defaultdict(set)
    instansi_px = defaultdict(Counter)
    monthly_visits = defaultdict(set)
    monthly_px = defaultdict(Counter)
    monthly_dokter = defaultdict(Counter)
    monthly_instansi = defaultdict(Counter)
    monthly_bpjs = Counter()
    hourly_visits = Counter()
    daily_visits = defaultdict(set)
    daily_px = defaultdict(Counter)
    daily_bpjs = Counter()

    row_count = 0
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        for cols in reader:
            if len(cols) < 16:
                continue
            no_lab = cols[0].strip().strip('"').strip('\t')
            if not no_lab:
                continue
            row_count += 1
            tgl_str = cols[8].strip().strip('"')
            tgl = parse_tgl(tgl_str, yr)
            bulan = tgl[:7]
            jam_str = cols[9].strip().strip('"')
            dokter = cols[10].strip().strip('"') or "APS (Atas Permintaan Sendiri)"
            instansi = cols[11].strip().strip('"') or "Umum"
            raw_px = cols[15].replace('\xa0', ' ').strip().strip('"').strip()
            px_name = " ".join(raw_px.split())
            nik = cols[3].strip().strip('"')

            if dokter.lower() in ('umum', '-', ''):
                dokter = "APS (Atas Permintaan Sendiri)"
            if instansi.lower() in ('umum', '-', ''):
                instansi = "Umum"

            # Unique visit tracking
            dokter_visits[dokter].add(no_lab)
            instansi_visits[instansi].add(no_lab)
            monthly_visits[bulan].add(no_lab)
            daily_visits[tgl].add(no_lab)

            global_visits.add(no_lab)
            global_dokter_visits[dokter].add(no_lab)
            global_instansi_visits[instansi].add(no_lab)

            is_bpjs = bool((len(nik) == 13 and nik.startswith('00')) or instansi.upper() == 'BPJS')
            if is_bpjs:
                daily_bpjs[tgl] += 1
                monthly_bpjs[bulan] += 1

            if jam_str:
                j = jam_str.split(':')[0]
                if j.isdigit():
                    h_int = int(j)
                    hourly_visits[h_int] += 1
                    global_hourly_visits[h_int] += 1

            if px_name and len(px_name) >= 2 and px_name.lower() not in ('keterangan', '-', '', 'null', 'none'):
                klp = tentukan_kelompok(px_name)
                px_kelompok_map[px_name] = klp
                all_px_counter[px_name] += 1
                dokter_px[dokter][px_name] += 1
                instansi_px[instansi][px_name] += 1
                monthly_px[bulan][px_name] += 1
                monthly_dokter[bulan][dokter] += 1
                monthly_instansi[bulan][instansi] += 1

                global_px_counter[px_name] += 1
                global_dokter_px[dokter][px_name] += 1
                global_instansi_px[instansi][px_name] += 1

    total_kunjungan = sum(len(v) for v in monthly_visits.values())
    total_tes = sum(all_px_counter.values())
    total_bpjs = sum(monthly_bpjs.values())

    global_per_tahun[yr]['kunjungan'] = total_kunjungan
    global_per_tahun[yr]['total_tes'] = total_tes
    global_per_tahun[yr]['bpjs'] = total_bpjs
    global_per_tahun[yr]['umum'] = total_kunjungan - total_bpjs

    # Top 100 pemeriksaan
    pemeriksaan_teratas = [
        {'nama': name, 'kelompok': px_kelompok_map.get(name, 'Lainnya'), 'jml': count}
        for name, count in all_px_counter.most_common(100)
    ]

    # Distribusi kelompok
    kelompok_counter = Counter()
    for name, count in all_px_counter.items():
        kelompok_counter[px_kelompok_map.get(name, 'Lainnya')] += count
    kelompok_distribusi = [
        {'kelompok': klp, 'jml': jml, 'persentase': round((jml / total_tes * 100), 1) if total_tes else 0}
        for klp, jml in kelompok_counter.most_common()
    ]

    # Dokter pengirim
    dokter_list = []
    for dok, v_set in dokter_visits.items():
        v_count = len(v_set)
        t_count = sum(dokter_px[dok].values())
        top_tes = [{'nama': name, 'jml': c} for name, c in dokter_px[dok].most_common(15)]
        dokter_list.append({
            'nama': dok,
            'dokter': dok,
            'total_kunjungan': v_count,
            'total_tes': t_count,
            'top_tes': top_tes
        })
    dokter_list.sort(key=lambda x: x['total_kunjungan'], reverse=True)

    # Instansi pengirim
    instansi_list = []
    for inst, v_set in instansi_visits.items():
        v_count = len(v_set)
        t_count = sum(instansi_px[inst].values())
        top_tes = [{'nama': name, 'jml': c} for name, c in instansi_px[inst].most_common(15)]
        instansi_list.append({
            'nama': inst,
            'instansi': inst,
            'total_kunjungan': v_count,
            'total_tes': t_count,
            'top_tes': top_tes
        })
    instansi_list.sort(key=lambda x: x['total_kunjungan'], reverse=True)

    # Per bulan
    per_bulan = {}
    for bln in sorted(monthly_visits.keys()):
        per_bulan[bln] = {
            'kunjungan': len(monthly_visits[bln]),
            'total_tes': sum(monthly_px[bln].values()),
            'bpjs': monthly_bpjs[bln],
            'top_tes': [{'nama': n, 'jml': c} for n, c in monthly_px[bln].most_common(5)],
            'top_dokter': [{'nama': n, 'jml': c} for n, c in monthly_dokter[bln].most_common(3)],
            'top_instansi': [{'nama': n, 'jml': c} for n, c in monthly_instansi[bln].most_common(3)]
        }

    # Per hari
    per_hari = {}
    for tgl in sorted(daily_visits.keys()):
        per_hari[tgl] = {
            'kunjungan': len(daily_visits[tgl]),
            'total_tes': sum(daily_px[tgl].values()),
            'bpjs': daily_bpjs[tgl]
        }

    # Jam periksa
    jam_periksa = []
    for h in range(6, 21):
        jam_periksa.append({
            'jam': h,
            'label': f"{h:02d}:00",
            'jumlah': hourly_visits[h]
        })

    year_data = {
        'tahun': yr,
        'total_kunjungan': total_kunjungan,
        'total_tes': total_tes,
        'total_bpjs': total_bpjs,
        'total_umum': total_kunjungan - total_bpjs,
        'pemeriksaan_teratas': pemeriksaan_teratas,
        'kelompok_distribusi': kelompok_distribusi,
        'dokter_pengirim': dokter_list,
        'instansi_pengirim': instansi_list,
        'per_bulan': per_bulan,
        'per_hari': per_hari,
        'jam_periksa': jam_periksa
    }

    data_by_year[yr] = year_data
    print(f"  [OK] Tahun {yr}: {total_kunjungan:,} kunjungan, {total_tes:,} tes, {len(dokter_list)} dokter, {len(instansi_list)} instansi.")

    # Simpan juga versi khusus untuk data_2021_agregat.json agar backwards compatible 100%
    if yr == '2021':
        with open('js/data_2021_agregat.json', 'w', encoding='utf-8') as f21:
            json.dump(year_data, f21, ensure_ascii=False, indent=2)

# Susun agregasi All-Time
print("\nMenyusun agregat All-Time (Semua Waktu 2019-2023)...")
global_total_kunjungan = sum(v['kunjungan'] for v in global_per_tahun.values())
global_total_tes = sum(global_px_counter.values())

global_pemeriksaan_teratas = [
    {'nama': name, 'kelompok': tentukan_kelompok(name), 'jml': count}
    for name, count in global_px_counter.most_common(100)
]

global_kelompok_counter = Counter()
for name, count in global_px_counter.items():
    global_kelompok_counter[tentukan_kelompok(name)] += count

global_kelompok_distribusi = [
    {'kelompok': klp, 'jml': jml, 'persentase': round((jml / global_total_tes * 100), 1) if global_total_tes else 0}
    for klp, jml in global_kelompok_counter.most_common()
]

global_dokter_list = []
for dok, v_set in global_dokter_visits.items():
    v_count = len(v_set)
    t_count = sum(global_dokter_px[dok].values())
    top_tes = [{'nama': name, 'jml': c} for name, c in global_dokter_px[dok].most_common(15)]
    global_dokter_list.append({
        'nama': dok,
        'dokter': dok,
        'total_kunjungan': v_count,
        'total_tes': t_count,
        'top_tes': top_tes
    })
global_dokter_list.sort(key=lambda x: x['total_kunjungan'], reverse=True)

global_instansi_list = []
for inst, v_set in global_instansi_visits.items():
    v_count = len(v_set)
    t_count = sum(global_instansi_px[inst].values())
    top_tes = [{'nama': name, 'jml': c} for name, c in global_instansi_px[inst].most_common(15)]
    global_instansi_list.append({
        'nama': inst,
        'instansi': inst,
        'total_kunjungan': v_count,
        'total_tes': t_count,
        'top_tes': top_tes
    })
global_instansi_list.sort(key=lambda x: x['total_kunjungan'], reverse=True)

final_historis = {
    'available_years': [yr for yr, _ in csv_files],
    'summary': {
        'total_kunjungan_all': global_total_kunjungan,
        'total_tes_all': global_total_tes,
        'per_tahun': dict(global_per_tahun)
    },
    'by_year': data_by_year,
    'all_time': {
        'total_kunjungan': global_total_kunjungan,
        'total_tes': global_total_tes,
        'pemeriksaan_teratas': global_pemeriksaan_teratas,
        'kelompok_distribusi': global_kelompok_distribusi,
        'dokter_pengirim': global_dokter_list,
        'instansi_pengirim': global_instansi_list
    }
}

output_path = 'js/data_historis_agregat.json'
with open(output_path, 'w', encoding='utf-8') as out_f:
    json.dump(final_historis, out_f, ensure_ascii=False, indent=2)

size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"\n[SELESAI] Data historis berhasil disimpan ke '{output_path}' ({size_mb:.2f} MB).")
print(f"Total registrasi: {global_total_kunjungan:,} dari {len(csv_files)} tahun.")
