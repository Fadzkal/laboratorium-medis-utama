"""
=============================================================================
DATABASE ADAPTER (SUPABASE & MYSQL READY)
=============================================================================
Menyediakan antarmuka tunggal untuk update data pemeriksaan laboratorium.
Saat ini menggunakan SupabaseAdapter. Saat migrasi ke Cloud VPS MySQL,
hanya perlu mengatur DB_MODE = "MYSQL" di config.py tanpa mengubah
kode bridge listening alat sama sekali.
=============================================================================
"""

import sys
import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any

from config import (
    DB_MODE,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
)
from dictionary import find_matching_test

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DB_ADAPTER")


class BaseAdapter:
    """Antarmuka dasar database adapter"""
    def cari_permintaan(self, sample_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def ambil_item_hasil(self, permintaan_id: str) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def update_hasil(self, hasil_id: str, nilai_angka: Optional[float], nilai_teks: Optional[str], nama_alat: str) -> bool:
        raise NotImplementedError

    def sync_hasil_alat(self, sample_id: str, hasil_list: List[Dict[str, Any]], nama_alat: str) -> Dict[str, Any]:
        """
        Alur sinkronisasi terpadu:
        1. Cari permintaan berdasarkan sample_id (barcode tabung)
        2. Ambil baris lab_hasil yang sudah dibuat dokter/kasir
        3. Cocokkan nama tes menggunakan dictionary
        4. Simpan nilai ke database
        """
        logger.info(f"Mencari permintaan untuk Sample ID: {sample_id} ({nama_alat})...")
        permintaan = self.cari_permintaan(sample_id)
        if not permintaan:
            logger.warning(f"Permintaan untuk barcode {sample_id} tidak ditemukan di database.")
            return {"sukses": False, "pesan": f"Permintaan barcode {sample_id} tidak ditemukan"}

        permintaan_id = permintaan["id"]
        no_lab = permintaan.get("no_lab", sample_id)
        logger.info(f"Ditemukan lembar: {no_lab} (ID: {permintaan_id})")

        items = self.ambil_item_hasil(permintaan_id)
        if not items:
            logger.warning(f"Tidak ada item pemeriksaan di lembar {no_lab}.")
            return {"sukses": False, "pesan": f"Lembar {no_lab} belum memiliki daftar pemeriksaan"}

        candidate_names = [it["nama"] for it in items]
        tersimpan = 0
        rincian = []

        for h in hasil_list:
            raw_code = h.get("test_name", "")
            raw_val = h.get("value", "")
            unit = h.get("unit", "")
            flag = h.get("flag", "")

            # Cari baris yang cocok
            matched_name = find_matching_test(raw_code, nama_alat, candidate_names)
            if not matched_name:
                logger.debug(f"Parameter '{raw_code}' tidak ada di lembar {no_lab}, dilewati.")
                continue

            # Temukan objek item
            target_item = next((it for it in items if it["nama"] == matched_name), None)
            if not target_item:
                continue

            # Parsing angka
            nilai_angka = None
            try:
                # Ganti koma dengan titik bila ada
                val_clean = str(raw_val).strip().replace(",", ".")
                nilai_angka = float(val_clean)
            except (ValueError, TypeError):
                pass

            nilai_teks = str(raw_val).strip() if nilai_angka is None else str(nilai_angka)

            ok = self.update_hasil(
                hasil_id=target_item["id"],
                nilai_angka=nilai_angka,
                nilai_teks=nilai_teks,
                nama_alat=nama_alat
            )

            if ok:
                tersimpan += 1
                rincian.append({
                    "kode_alat": raw_code,
                    "nama_pemeriksaan": matched_name,
                    "nilai": nilai_angka if nilai_angka is not None else nilai_teks,
                    "satuan": unit,
                    "flag": flag
                })
                logger.info(f"OK: {matched_name} = {nilai_teks} {unit} -> {no_lab}")

        if tersimpan > 0 and hasattr(self, "naikkan_status_dikerjakan"):
            self.naikkan_status_dikerjakan(permintaan_id)

        return {
            "sukses": tersimpan > 0,
            "sample_id": sample_id,
            "no_lab": no_lab,
            "total_diterima": len(hasil_list),
            "total_tersimpan": tersimpan,
            "rincian": rincian
        }


# ===========================================================================
# IMPLEMENTASI 1: SUPABASE ADAPTER (AKTIF SEKARANG)
# ===========================================================================
class SupabaseAdapter(BaseAdapter):
    def __init__(self):
        self.url = SUPABASE_URL.rstrip("/")
        # Gunakan service_key jika ada (bypass RLS), atau anon_key
        self.key = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_ANON_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def cari_permintaan(self, sample_id: str) -> Optional[Dict[str, Any]]:
        sid = str(sample_id).strip()
        # 1. Cari exact match no_lab = sid (misal: LAB-2026-0026 atau 26090026)
        endpoint = f"{self.url}/rest/v1/lab_permintaan?no_lab=eq.{sid}&select=id,no_lab,pasien_id,status&limit=1"
        try:
            r = requests.get(endpoint, headers=self.headers, timeout=10)
            if r.status_code == 200 and r.json():
                return r.json()[0]
        except Exception as e:
            logger.error(f"Error query Supabase cari_permintaan (exact): {e}")

        # 2. Ekstrak nomor urutan sampel bila ada angka
        seq = None
        if sid.isdigit():
            seq = sid[-4:].zfill(4)
        else:
            import re
            m = re.search(r"(\d{1,4})$", sid)
            if m:
                seq = m.group(1).zfill(4)

        if seq:
            endpoint = f"{self.url}/rest/v1/lab_permintaan?no_lab=ilike.*{seq}&select=id,no_lab,pasien_id,status&limit=1"
            try:
                r = requests.get(endpoint, headers=self.headers, timeout=10)
                if r.status_code == 200 and r.json():
                    return r.json()[0]
            except Exception as e:
                logger.error(f"Error query Supabase cari_permintaan (ilike seq): {e}")

        # 3. Fallback: Cari di status DIMINTA atau DIKERJAKAN terbaru
        endpoint = f"{self.url}/rest/v1/lab_permintaan?status=in.(DIMINTA,DIKERJAKAN)&order=created_at.desc&select=id,no_lab,pasien_id,status&limit=20"
        try:
            r = requests.get(endpoint, headers=self.headers, timeout=10)
            if r.status_code == 200:
                rows = r.json()
                for row in rows:
                    nl = str(row.get("no_lab", ""))
                    if seq and nl.endswith(seq):
                        return row
                    if sid in nl:
                        return row
        except Exception as e:
            logger.error(f"Error query Supabase fallback: {e}")

        return None

    def naikkan_status_dikerjakan(self, permintaan_id: str):
        """Memperbarui status lembar hasil dari DIMINTA menjadi DIKERJAKAN saat hasil alat masuk"""
        endpoint = f"{self.url}/rest/v1/lab_permintaan?id=eq.{permintaan_id}&status=eq.DIMINTA"
        try:
            requests.patch(endpoint, headers=self.headers, json={"status": "DIKERJAKAN"}, timeout=10)
        except Exception as e:
            logger.warning(f"Gagal memperbarui status lembar ke DIKERJAKAN: {e}")

    def ambil_item_hasil(self, permintaan_id: str) -> List[Dict[str, Any]]:
        endpoint = f"{self.url}/rest/v1/lab_hasil?permintaan_id=eq.{permintaan_id}&select=id,lab_id,nama,nilai_angka,nilai_teks,satuan"
        try:
            r = requests.get(endpoint, headers=self.headers, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            logger.error(f"Error ambil_item_hasil: {e}")
        return []

    def update_hasil(self, hasil_id: str, nilai_angka: Optional[float], nilai_teks: Optional[str], nama_alat: str) -> bool:
        endpoint = f"{self.url}/rest/v1/lab_hasil?id=eq.{hasil_id}"
        payload = {
            "nilai_angka": nilai_angka,
            "nilai_teks": nilai_teks,
            "catatan": f"Otomatis dari {nama_alat}"
        }
        try:
            r = requests.patch(endpoint, headers=self.headers, json=payload, timeout=10)
            return r.status_code in (200, 204)
        except Exception as e:
            logger.error(f"Error update_hasil: {e}")
            return False


    # ------------------------------------------------------------------
    # RIWAYAT SAMPEL: Simpan setiap hasil alat ke tabel lis_riwayat_sampel
    # ------------------------------------------------------------------
    def insert_riwayat_sampel(self, data: Dict[str, Any]) -> bool:
        """Menyimpan satu rekord riwayat sampel ke Supabase (lis_riwayat_sampel)"""
        endpoint = f"{self.url}/rest/v1/lis_riwayat_sampel"
        hasil_obj = data.get("hasil_json", [])
        if isinstance(hasil_obj, str):
            try:
                hasil_obj = json.loads(hasil_obj)
            except Exception:
                hasil_obj = []

        payload = {
            "sample_id": str(data.get("sample_id", "")),
            "alat": str(data.get("alat", "")),
            "nama_pasien": data.get("nama_pasien"),
            "no_rm": data.get("no_rm"),
            "status_mapping": data.get("status_mapping", "BELUM"),
            "raw_data": data.get("raw_data"),
            "hasil_json": hasil_obj,
        }
        try:
            r = requests.post(endpoint, headers=self.headers, json=payload, timeout=10)
            if r.status_code in (200, 201):
                logger.info(f"Riwayat sampel {data.get('sample_id')} tersimpan di Supabase.")
                return True
            else:
                logger.warning(f"Gagal simpan riwayat sampel: HTTP {r.status_code} - {r.text}")
                return False
        except Exception as e:
            logger.error(f"Error insert_riwayat_sampel: {e}")
            return False

    def hapus_riwayat_sampel(self, record_id: str, hard: bool = False) -> bool:
        """Soft-delete (is_deleted=true) atau hard-delete riwayat sampel"""
        if hard:
            endpoint = f"{self.url}/rest/v1/lis_riwayat_sampel?id=eq.{record_id}"
            try:
                r = requests.delete(endpoint, headers=self.headers, timeout=10)
                return r.status_code in (200, 204)
            except Exception as e:
                logger.error(f"Error hard-delete riwayat: {e}")
                return False
        else:
            endpoint = f"{self.url}/rest/v1/lis_riwayat_sampel?id=eq.{record_id}"
            try:
                r = requests.patch(endpoint, headers=self.headers, json={"is_deleted": True}, timeout=10)
                return r.status_code in (200, 204)
            except Exception as e:
                logger.error(f"Error soft-delete riwayat: {e}")
                return False

    def ambil_riwayat_sampel(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Mengambil riwayat sampel terakhir dari Supabase (exclude soft-deleted)"""
        endpoint = (
            f"{self.url}/rest/v1/lis_riwayat_sampel"
            f"?is_deleted=eq.false&order=waktu_terima.desc&limit={limit}"
        )
        try:
            r = requests.get(endpoint, headers=self.headers, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            logger.error(f"Error ambil_riwayat_sampel: {e}")
        return []

    # ------------------------------------------------------------------
    # HEARTBEAT: Perbarui status bridge di tabel lis_status_bridge
    # ------------------------------------------------------------------
    def update_heartbeat(self, status_data: Dict[str, Any]) -> bool:
        """Upsert heartbeat status bridge ke Supabase (lis_status_bridge)"""
        endpoint = f"{self.url}/rest/v1/lis_status_bridge?id=eq.BRIDGE_PC_LAB"
        listener_obj = status_data.get("listener_json", {})
        if isinstance(listener_obj, str):
            try:
                listener_obj = json.loads(listener_obj)
            except Exception:
                listener_obj = {}

        payload = {
            "id": "BRIDGE_PC_LAB",
            "status": status_data.get("status", "ONLINE"),
            "ip_pc_lab": status_data.get("ip_pc_lab", "127.0.0.1"),
            "port_mindray": status_data.get("port_mindray"),
            "port_sysmex": status_data.get("port_sysmex"),
            "port_wondfo": status_data.get("port_wondfo"),
            "port_api": status_data.get("port_api"),
            "listener_json": listener_obj,
            "total_buffer": status_data.get("total_buffer", 0),
            "last_heartbeat": status_data.get("last_heartbeat"),
        }
        headers_upsert = dict(self.headers)
        headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
        try:
            # Upsert via POST on-conflict
            ep_upsert = f"{self.url}/rest/v1/lis_status_bridge?on_conflict=id"
            r = requests.post(ep_upsert, headers=headers_upsert, json=payload, timeout=10)
            if r.status_code in (200, 201):
                return True
            else:
                # Fallback ke PATCH jika baris sudah ada
                r2 = requests.patch(endpoint, headers=self.headers, json=payload, timeout=10)
                return r2.status_code in (200, 204)
        except Exception as e:
            logger.error(f"Error update_heartbeat: {e}")
            return False


# ===========================================================================
# IMPLEMENTASI 2: MYSQL ADAPTER (SIAP SAAT MIGRASI KE CLOUD VPS)
# ===========================================================================
class MySQLAdapter(BaseAdapter):
    """
    Adapter MySQL murni yang siap dipakai saat aplikasi dipindahkan ke VPS MySQL.
    Membutuhkan paket `pymysql` atau `mysql-connector-python`.
    """
    def __init__(self):
        try:
            import pymysql
            self.pymysql = pymysql
        except ImportError:
            logger.warning("Paket 'pymysql' belum terpasang. Jalankan: pip install pymysql saat beralih ke MySQL.")
            self.pymysql = None

    def _get_connection(self):
        if not self.pymysql:
            raise RuntimeError("pymysql tidak tersedia")
        return self.pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            cursorclass=self.pymysql.cursors.DictCursor,
            autocommit=True
        )

    def cari_permintaan(self, sample_id: str) -> Optional[Dict[str, Any]]:
        sid = str(sample_id).strip()
        sql = "SELECT id, no_lab, pasien_id, status FROM lab_permintaan WHERE no_lab = %s OR no_lab LIKE %s LIMIT 1"
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(sql, (sid, f"%{sid[-4:]}"))
                res = cur.fetchone()
            conn.close()
            return res
        except Exception as e:
            logger.error(f"MySQL cari_permintaan error: {e}")
            return None

    def ambil_item_hasil(self, permintaan_id: str) -> List[Dict[str, Any]]:
        sql = "SELECT id, lab_id, nama, nilai_angka, nilai_teks, satuan FROM lab_hasil WHERE permintaan_id = %s"
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(sql, (permintaan_id,))
                res = cur.fetchall()
            conn.close()
            return res or []
        except Exception as e:
            logger.error(f"MySQL ambil_item_hasil error: {e}")
            return []

    def update_hasil(self, hasil_id: str, nilai_angka: Optional[float], nilai_teks: Optional[str], nama_alat: str) -> bool:
        sql = """
            UPDATE lab_hasil 
            SET nilai_angka = %s, nilai_teks = %s, catatan = %s, diisi_pada = NOW() 
            WHERE id = %s
        """
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(sql, (nilai_angka, nilai_teks, f"Otomatis dari {nama_alat}", hasil_id))
            conn.close()
            return True
        except Exception as e:
            logger.error(f"MySQL update_hasil error: {e}")
            return False


# ===========================================================================
# FACTORY: Dapatkan Adapter Sesuai Konfigurasi
# ===========================================================================
def get_adapter() -> BaseAdapter:
    if DB_MODE.upper() == "MYSQL":
        logger.info("Menggunakan database adapter: MySQL (Cloud VPS)")
        return MySQLAdapter()
    else:
        logger.info("Menggunakan database adapter: Supabase (REST API)")
        return SupabaseAdapter()
