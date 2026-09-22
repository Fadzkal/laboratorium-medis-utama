-- =====================================================================
--  66_ANTREAN_LAYAR_NAMA_PASIEN.SQL
--  Memperbarui fungsi antrean_layar(p_token text) agar menyertakan
--  nama pasien pada data panggilan dan kartu loket/poli.
-- =====================================================================

create or replace function public.antrean_layar(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_token text; v_tgl date; v_konf jsonb; v_hasil jsonb;
begin
  select token_layar, konfigurasi into v_token, v_konf
    from sys_antrean_pengaturan where id = 1;

  -- Token kosong berarti fitur layar belum dinyalakan.
  if coalesce(v_token, '') = '' or length(coalesce(p_token,'')) < 16
     or p_token is distinct from v_token then
    return jsonb_build_object('galat', 'Token layar tidak dikenal.');
  end if;

  v_tgl := public.tgl_klinik();

  select jsonb_build_object(
    'tanggal',   v_tgl,
    'waktu',     to_char(now() at time zone 'Asia/Makassar', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'klinik',    (select nama from faskes where id = 1),
    'judul',     coalesce(nullif(v_konf->>'judul_layar',''), 'Antrean Pasien'),
    'teks_berjalan', coalesce(v_konf->>'teks_berjalan', ''),

    -- Panggilan terbaru dengan nama pasien
    'panggilan', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id,
               'nomor', x.nomor,
               'nama_pasien', x.nama_pasien,
               'tujuan', x.tujuan,
               'poli', x.nama_poli,
               'waktu', x.waktu,
               'ulang', x.urutan))
        from (select pg.id,
                     a.nomor,
                     coalesce(p.nama, a.nama_snapshot, '') as nama_pasien,
                     pg.tujuan,
                     po.nama as nama_poli,
                     to_char(pg.waktu at time zone 'Asia/Makassar', 'HH24:MI') as waktu,
                     pg.urutan
                from antrean_panggilan pg
                join antrean a on a.id = pg.antrean_id
                left join pasien p on p.id = a.pasien_id
                join poli po   on po.id = a.poli_id
               where pg.tanggal = v_tgl
               order by pg.id desc limit 8) x), '[]'::jsonb),

    -- Daftar poli dengan nomor dan nama pasien yang sedang dipanggil
    'poli', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nama',           po.nama,
               'prefix',         po.prefix_antrean,
               'dipanggil',      public.antrol_antrean_panggil(po.id, v_tgl),
               'dipanggil_nama', coalesce((
                 select coalesce(p.nama, a.nama_snapshot, '')
                   from antrean_panggilan pg
                   join antrean a on a.id = pg.antrean_id
                   left join pasien p on p.id = a.pasien_id
                  where pg.tanggal = v_tgl and a.poli_id = po.id
                  order by pg.id desc limit 1
               ), ''),
               'berikut',        coalesce((
                 select jsonb_agg(n.nomor order by n.no_urut)
                   from (select nomor, no_urut from antrean
                          where tanggal = v_tgl and poli_id = po.id
                            and status in ('MENUNGGU','BELUM_HADIR')
                          order by no_urut limit 4) n), '[]'::jsonb),
               'sisa',           (select count(*) from antrean
                                   where tanggal = v_tgl and poli_id = po.id
                                     and status in ('MENUNGGU','BELUM_HADIR','DIPANGGIL')),
               'selesai',        (select count(*) from antrean
                                   where tanggal = v_tgl and poli_id = po.id
                                     and status = 'SELESAI'))
             order by po.urutan)
        from poli po where po.aktif), '[]'::jsonb)
  ) into v_hasil;

  return v_hasil;
end $$;

grant execute on function public.antrean_layar(text) to anon;

comment on function public.antrean_layar(text) is
  'Dipanggil layar antrean TV/display tanpa login menggunakan token rahasia layar tunggu, kini menyertakan nama pasien.';
