import json
from collections import Counter, defaultdict

csv_path = r"c:\lab_utama\hasil_lab_2021_NIK_utuh_22300_pasien.csv"

# Kelompok mapping berdasarkan nama pemeriksaan
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

def parse_tgl(s):
    if not s:
        return '2021-01-01'
    s_clean = s.strip().strip('"').lower()
    for b_nama, b_num in bulan_map.items():
        if b_nama in s_clean:
            parts = [p for p in s_clean.replace('/', ' ').replace('-', ' ').split() if p]
            if len(parts) >= 3:
                d = parts[0].zfill(2)
                y = '2021'
                return f"{y}-{b_num}-{d}"
    return '2021-01-01'

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

hourly_visits = Counter()
gender_counts = Counter()
cara_bayar_counts = Counter()

daily_visits = defaultdict(set)
daily_px = defaultdict(Counter)
daily_dokter = defaultdict(Counter)
daily_instansi = defaultdict(Counter)
daily_bpjs = Counter()

with open(csv_path, 'r', encoding='utf-8-sig', errors='replace') as f:
    f.readline()
    for line in f:
        cols = line.strip().split(';')
        if len(cols) < 16:
            continue
        no_lab = cols[0].strip().strip('"').strip('\t')
        if not no_lab:
            continue
        
        tgl_str = cols[8].strip().strip('"')
        tgl = parse_tgl(tgl_str)
        bulan = tgl[:7]
        jam_str = cols[9].strip().strip('"')
        dokter = cols[10].strip().strip('"') or "APS (Atas Permintaan Sendiri)"
        instansi = cols[11].strip().strip('"') or "Umum"
        raw_px = cols[15].replace('\xa0', ' ').strip().strip('"').strip()
        px_name = " ".join(raw_px.split())
        gender = cols[4].strip().strip('"')
        nik = cols[3].strip().strip('"')

        # Clean dokter & instansi
        if dokter.lower() in ('umum', '-', ''):
            dokter = "APS (Atas Permintaan Sendiri)"
        if instansi.lower() in ('umum', '-', ''):
            instansi = "Umum"

        # Unique visit tracking
        dokter_visits[dokter].add(no_lab)
        instansi_visits[instansi].add(no_lab)
        monthly_visits[bulan].add(no_lab)
        daily_visits[tgl].add(no_lab)

        is_bpjs = bool((len(nik) == 13 and nik.startswith('00')) or instansi.upper() == 'BPJS')
        if is_bpjs:
            daily_bpjs[tgl] += 1

        if jam_str:
            j = jam_str.split(':')[0]
            if j.isdigit():
                hourly_visits[int(j)] += 1

        if px_name and len(px_name) >= 2 and px_name.lower() not in ('keterangan', '-', '', 'null', 'none'):
            klp = tentukan_kelompok(px_name)
            px_kelompok_map[px_name] = klp
            all_px_counter[px_name] += 1
            dokter_px[dokter][px_name] += 1
            instansi_px[instansi][px_name] += 1
            monthly_px[bulan][px_name] += 1
            monthly_dokter[bulan][dokter] += 1
            monthly_instansi[bulan][instansi] += 1
            daily_px[tgl][px_name] += 1
            daily_dokter[tgl][dokter] += 1
            daily_instansi[tgl][instansi] += 1

print(f"Total Unique Valid Tests Count: {sum(all_px_counter.values())}")
print(f"Total Unique Test Names: {len(all_px_counter)}")
print(f"Total Doctors: {len(dokter_visits)}")
print(f"Total Institutions: {len(instansi_visits)}")

# Build compact data structure
data_2021 = {
    "total_kunjungan": 22300,
    "total_tes": sum(all_px_counter.values()),
    "pemeriksaan_teratas": [
        {"nama": name, "kelompok": px_kelompok_map[name], "jml": count}
        for name, count in all_px_counter.most_common(100)
    ],
    "kelompok_distribusi": [
        {"kelompok": k, "jml": c}
        for k, c in Counter({
            k: sum(count for name, count in all_px_counter.items() if px_kelompok_map[name] == k)
            for k in set(px_kelompok_map.values())
        }).most_common()
    ],
    "dokter_pengirim": [
        {
            "nama": dok,
            "total_kunjungan": len(dokter_visits[dok]),
            "total_tes": sum(dokter_px[dok].values()),
            "top_tes": [
                {"nama": px, "kelompok": px_kelompok_map.get(px, 'Lainnya'), "jml": c}
                for px, c in dokter_px[dok].most_common(15)
            ]
        }
        for dok, _ in sorted(dokter_visits.items(), key=lambda x: len(x[1]), reverse=True)
    ],
    "instansi_pengirim": [
        {
            "nama": ins,
            "total_kunjungan": len(instansi_visits[ins]),
            "total_tes": sum(instansi_px[ins].values()),
            "top_tes": [
                {"nama": px, "kelompok": px_kelompok_map.get(px, 'Lainnya'), "jml": c}
                for px, c in instansi_px[ins].most_common(15)
            ]
        }
        for ins, _ in sorted(instansi_visits.items(), key=lambda x: len(x[1]), reverse=True)
    ],
    "per_bulan": {
        b: {
            "bulan": b,
            "kunjungan": len(monthly_visits[b]),
            "total_tes": sum(monthly_px[b].values()),
            "top_tes": [{"nama": p, "kelompok": px_kelompok_map.get(p, 'Lainnya'), "jml": c} for p, c in monthly_px[b].most_common(15)],
            "top_dokter": [{"nama": d, "jml": c} for d, c in monthly_dokter[b].most_common(10)],
            "top_instansi": [{"nama": i, "jml": c} for i, c in monthly_instansi[b].most_common(10)]
        }
        for b in sorted(monthly_visits.keys())
    },
    "per_hari": {
        tgl: {
            "kunjungan": len(daily_visits[tgl]),
            "total_tes": sum(daily_px[tgl].values()),
            "bpjs": daily_bpjs[tgl],
            "top_tes": [{"nama": p, "jml": c} for p, c in daily_px[tgl].most_common(10)],
            "top_dokter": [{"nama": d, "jml": c} for d, c in daily_dokter[tgl].most_common(5)],
            "top_instansi": [{"nama": i, "jml": c} for i, c in daily_instansi[tgl].most_common(5)]
        }
        for tgl in sorted(daily_visits.keys())
    },
    "jam_periksa": [
        {"jam": f"{j:02d}:00", "jml": hourly_visits[j]}
        for j in range(6, 21)
    ]
}

out_path = r"c:\lab_utama\rme-lab-utama\js\data_2021_agregat.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(data_2021, f, ensure_ascii=False, indent=2)

import os
size_kb = os.path.getsize(out_path) / 1024
print(f"Generated JSON saved at: {out_path} ({size_kb:.1f} KB)")
