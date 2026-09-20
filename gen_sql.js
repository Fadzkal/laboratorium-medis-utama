const fs = require('fs');
const data = `partner_id;partner_name;partner_address;partner_phone;partner_contact;partner_disc
21071019;Apotek Sehati;;;;0
1908960;Apotik Menmari;Banyumas;( 0281 ) 796357;Apotek;
2103993;BAKEUDA (Badan Keuangan Daerah) Purbalingga;Jl. Onje No. 1B, Purbalingga Lor;Bu Dede;-;
2008971;Bank BRI Cab. Purbalingga;Jl. Jend. Soedirman No. 214 A, Bancar, Purbalingga;85842023137;Bu Cici;
22021031;Bank CIMB Niaga Cab. Purbalingga;Jl. Jend. Suidrman No.37, Purbalingga Kulon, Purbalingga;(0281) 6597194;;0
21061012;Bank Jateng Cab. Purbalingga;;;;0
2012982;BNI Cab. Banjarnegara;Jl. Letjend S. Parman, Parakancanggah, Banjarnegara;81325356786;Pak Farid;
2012981;BNI Cab. Purbalingga;Jl. Onje, Purbalingga Lor (ALun-Alun);81325356786;Pak Farid;
2103992;BPK RI (Badan Pemeriksa Keuangan RI) Perwakilan Provinsi Jawa Tengah;-;-;-;
2012977;BPN Purbalingga;Jl. MT Haryono No.45, Purbalingga Kulon;Bu Dede;-;
2011976;BPR BKK Purbalingga;Jl. Jend. Soedirman No.109, Purbalingga Lor;82242730769;Bu Juli;
21051009;BSI Cab. Purbalingga;;;;0
23071069;CV. Phoenix Agung Prima; Jl. Gerilya, Dusun Kebanaran, Karangmanyar, Kec. Kalimanah, Kabupaten Purbalingga;;;0
21101027;Dinas Pekerjaan dan Penataan Ruang Purbalingga;;;;0
21041002;Dinas Pendidikan Purbalingga;;;;0
2102990;Dinas Pertanian Purbalingga;Jl. S Parman No 23, Bancar, Purbalingga;Bu Dede;-;
22061040;DPP dr. Siti Rokhayah, M.H;Kalikabong, Purbalingga;85842230832;;0
23071065;dr. Ajib Abdul Aziz;;;;0
1811932;dr. Bambang Sidik;Jl. Karangreja, Kutasari Purbalingga;81327136060;dr. Bambang;
1811936;dr. Desy Hartini;Bobotsari;82221752469;dr. Desy;
22121054;dr. Dwika Herdykiawan;;;;0
1903955;dr. Herni Setiyowati;Ds. Blater 01/05, Kalimanah;81391025003;dr. Herni;
1803909;dr. Jusi  Febrianto, MPH;Klinik NU Kutasari;Bu Dede;-;
22051038;dr. Mochamad Ansori, M.M;Jl. Raya Bojongsari KM5 Purbalingga;;;0
22101050;dr. Muhammad Yaziruddin, MM;Limbangan;;;0
1901953;dr. Nonot Mulyono;RSUD, sebrang ayam goreng ani (praktek mandiri);81548839666;dr. Nonot;
21101028;dr. Puspita Sari;;;;0
1901951;dr. Retno Noorwulandari (JST);Arah Padamara sebelum Hassya Medica;-;-;
21081024;dr. Retno Sri Haswati;Karanganyar 07/01, Purbalingga;;;0
25101131;dr. Siti Rochajah;;;;0
24051085;dr. Sri Banun Saparadi;jalan gatot subroto no. 39 Purwokerto;;;0
1911964;dr. Sutanto, M.Kes;Penaruban;Bu Dede;-;
23051058;dr. Ujang Yanyan Maulana/ dr. U;;;;0
1901952;dr. Widiyati Poesoko;-;-;-;
1811921;dr. Yoso Mulyadi;Bojongsari;81225555696;dr. Yoso;
23051057;dr. Yusuf Sutrisno;;;;0
21031001;Forum Komunikasi HRD Purbalingga (FKHRD);Purbalingga;;diskon 20%;0
2010974;GRAPARI TELKOMSEL Purbalingga;Jl. MT. Haryono, Purbalingga Kulon;81226999911;Mas Rohmah;
24071097;Griya dr.U;;;;0
24071099;IIDI Purbalingga;;;;0
25111136;Intibios Lab Klinik dan Farmasi;;;;0
22041035;(JANGAN DIPAKAI) Klinik Pratama Kartika 03;(Jangan dipakai);;;0
2102988;Kantor  Advokat LBH Perisai Hj. Sugeng;Jl. S. Parman, Bancar;81393414696;Pak Nugroho;
21071021;Kelurahan Penaruban;;;;0
1811933;Klinik Abmi Medika;Jl. Raya Majingklak, Karangmoncol;82322543441;Mba Eli;
24051091;Klinik Ananda sehati;Jl. Kober No.170-171, Kober, Kec. Purwokerto Bar., Kabupaten Banyumas, Jawa Tengah 53132;;;0
25071126;Klinik Ardio Husada;Jl. Kyai Akhmad Mursyid No.29, RT.03/RW.03, Dusun II Sokaraja Lo, Sokaraja Lor, Kec. Sokaraja, Kabupaten Banyumas, Jawa Tengah 53181;;;0
24111107;Klinik Bhayangkara Polres Banyumas ;Jl. Jend. Gatot Subroto, Brubahan, Purwokerto Lor, Kec. Purwokerto Tim., Kabupaten Banyumas, Jawa Tengah 53116;;;0
1811918;Klinik dr. Shalam;Jl. DI Panjaitan;85293198480;Mba Fatonah (Pengurus Prolanis);
23031055;Klinik Fadilah;Depan RSHI;;;0
22111053;Klinik Flamboyan;;;;0
1811922;Klinik Griya Medica;Jl. Kom Notosumarsono No.15 A, Purbalingga Kidul;81322222083;dr. Reno;
2010975;Klinik Handayani Medica;Jl. Mayjend Sungkono, Selabaya;Bu Dede;-;
2002965;Klinik Hassya Medica;Jl. Raya Padamara;81322222083;dr. Reno;
24071098;Klinik IDI Purwokerto;;;;0
1909961;Klinik Kasih Medica;Jl. Raya Karangpucung, Kasih, Kertanegara;8121565580;Pak Suwardi;
22071042;Klinik Klinikita;Kemangkon;;;0
22041034;Klinik LANUD J.B Soedirman;Wirasaba, Bukateja, Purbalingga;;;0
1908958;Klinik Mitra Permata Husada;Jl. Ahmad Yani No. 65, Kandanggampang;82190061000;dr. Yosiana;
24051083;Klinik Modern Medika KGL (JTS); Jln.raya serang km.68 ruko b-6 komplek, Jl. Raya Modern Industri, Nambo Ilir, Kec. Kibin, Kabupaten Serang, Banten 42186;;;0
2102987;Klinik NU Bukateja;Majasari, Bukateja;85747018187;Analis NU Bukateja;
23051059;Klinik NU Karangmoncol;;;;0
1811935;Klinik NU Kutasari;Kutasati, Purbalingga;85728407391;Mas Adit (Pengurus Prolanis);
1811919;Klinik PMI Purbalingga;Purbalingga Kidul;Bu Dede;-;
1811923;Klinik Pratama Kartika 03 ;Jl. Letjend S. Parman No.1, Bancar;Bu Dede;-;
23071066;Klinik Sarza Medika;Karangduren;;;0
1802900;Klinik Siti Chotijah;Bukateja;82225471885;Mas Tono;
24111103;Klinik Teluk Sehat ;Jl. Mahoni Raya No.199, Karang Malang, Teluk, Kec. Purwokerto Sel., Kabupaten Banyumas, Jawa Tengah 53181;;;0
23081071;Klinik Vira Medika;;;;0
24061094;Klinik Yakkum;Purwareja Klampok;;;0
23061061;Klinik Yonif 406;Bojong;;;0
24031077;Koramil 03 Kalimanah;Jl. Raya Mayjen Sungkono, Dusun 1, Kalimanah Wetan, Kec. Kalimanah, Kabupaten Purbalingga, Jawa Tengah;;;0
24051082;Koramil 08 Bobotsari;Jl. Kol Sugiri No. 04, Bobotsari, Dusun III, Gandasuli, Purbalingga, Kabupaten Purbalingga;;;0
21071020;KPP Pratama Purbalingga;Jl. Letjend S. Parman No. 43, Bancar;85720026262;Pak Irin;0
21091025;KPU Purbalingga;;;;0
25011119;Laboratorium Utama;Jl DI Pandjaitan No. 94;;;0
2103994;LPK Borneo;Balikpapan;-;-;
26061140;LPK Hikari Juku;;;;0
25071128;LPK Hikayat;;;;0
25091130;LPK Hikayat Aji Klampok;;;;0
24051093;LPK Jantras;Jl. Raya Bojong, RT.005/RW.002;;;0
2101985;LPK KAZUO;Perum Griya Satria Purbalingga;8,95358E+11;Mas Bram;
26081142;LPK Massaihara Cabang Purbalingga;Kaligondang;;;0
1911963;LPK Sahabat Language School;Purbalingga;85211102821;Pak Agus;
1812948;LPK SHIROI;Rajawana, Karangmoncol;87734623452;Pak Sukanto;
21071016;Nakumi Nakabi;Perum GPA Blok D.21 Purbalingga;;;0
1803908;Naturindo;Purbalingga;Bu Dede;-;
2103999;PDAM Purbalingga ;Jl. Letjend S. Parman No.62, Purbalingga;;;0
2012979;Pegadaian Purbalingga;Jl. Ahmad Yani, Kandanggampang;Bu Dede;-;
25051122;PKD Karangcengis ;Desa Karangcengis, Kecamatan Kutawis ;;;0
24121115;PKD Sokawera;Desa Sokawera, Kec. Padamara;;;0
24111102;PKD Wirasaba;;;;0
1811926;Pkm Bobotsari;RS Yosomiharjo No.16, Bobotsari;82221845032;Bu Wasiti (Pengurus Prolanis);
1811939;Pkm Bojong;Jl. Raya Bojong, Purbalingga;89605632840;Mas Agung;
1811946;Pkm Bojongsari;Bojongsari;85771782777;Mba Usi;
1901950;Pkm Bukateja;Jl. Bukateja;Bu Dede;879252589;
24111104;Pkm Kalibagor;Jl. Suwarjono No.48, Dusun II Kalibagor, Kalibagor, Kec. Kalibagor, Kabupaten Banyumas, Jawa Tengah 53182;;;0
1811942;Pkm Kaligondang;Kaligondang;Bu Dede;-;
1812947;Pkm Kalikajar;Kalikajar;81228313453;Mba Hesti (Pengurus Prolanis);
1802895;Pkm Kalimanah;Kalimanah;85643637779;Mba Rizki;
1811930;Pkm  Karanganyar;Karanganyar;Bu Dede;-;
1811927;Pkm Karangjambu;Karangjambu;Bu Dede;-;
1811940;Pkm Karangmoncol;Karangmoncol;Bu Dede;-;
1811941;Pkm Karangreja;Karangreja;Bu Dede;-;
1811943;Pkm Karangtengah;Karangtengah;Bu Dede;-;
24041078;PKM Karang Tengah;Karang Tengah;;;0
1812949;Pkm Kejobong;Kejobong;Bu Dede;-;
1811937;Pkm Kemangkon;Kemangkon;8156604936;Pak Ciptadi (Pengurus Prolanis);
24111110;Pkm Kembaran II;Kramat, Banyumas, Kabupaten Banyumas, Jawa Tengah 53183;;;0
1811934;Pkm Kutasari;Kutasari;85227030259;dr. Laras (Pengurus Prolanis);
1901954;Pkm Kutawis;Kutawis;81548668194;Pak Pur (Pengurus Prolanis);
1811931;Pkm Mrebet;Mrebet;81903053232;Mas Khoerul (Pengurus Prolanis);
1811929;Pkm Padamara;Jl. Raya Padamara;85290211670;Mas Arif (Pengurus Prolanis);
23101074;PKM Palaran Samarinda;;;;0
1811925;Pkm Pengadegan;Pengadegan;Bu Dede;-;
22071048;Pkm Punggelan 1;Banjarnegara;;;0
1810917;PKM Purbalingga;Purbalingga;Bu Dede;-;
24121113;Pkm Purwokerto Utara 2;;;;0
1811924;PKM Rembang;Rembang;Bu Dede;-;
1811944;PKM REMBANG;(Jangan dipakai);Bu Dede;-;
1811938;PKM Serayu Larangan;Serayu Larangan;Bu Dede;-;
25101135;PMB Bidan Esti Utami;Kalikajar;;;0
1903956;Polres Purbalingga ;Purbalingga Kidul;Bu Dede;-;
2009972;PPBRI Cab. Purbalingga;Jl. Jend. Soedirman No. 214 A, Bancar, Purbalingga;8122770299;Pak Hartanto;
2006968;Proyek Pembangunan Bandar Udara JB. Soedirman Wirasaba;Wirasaba;82231386831;Mas Dimas;
22101049;PT Asuransi Jiwa Inhealth Indonesia (Mandiri Inhealth);;;;0
22101052;PT. Asyki;;;;0
23061063;PT. Bima Nugraha;Jalan Jetis, Toyareka, Bojong, Dusun II, Jetis, Kec. Kemangkon;;;0
24081100;PT. Bintang Catur Adhiyasa;;;;0
1809915;PT. Bintang Mas Triyasa;Jl. Soekarno Hatta, Mewek, Kalimanah;85726458766;Mba Esti;
21051006;PT. Boyang Industrial;Jl. Jendral Ahmad Yani No. 4A;;;0
2102989;PT BPR Buana Artha Kassiti;Penaruban, Kaligondang;-;Bu Triyas;
24041080;PT.Brantas Abipraya - PT.SAC Nusantara;;;;0
21061013;PT. BRANTAS ABIPRAYA SLINGA PROJECT;;;;0
25101133;PT. Bumame Cahaya Medika;;;;0
24021075;PT. Cipta Kridatama;Jalan Cilandak KKO No. 1 Jakarta;;;0
24071095;PT. Cosmoprof Indokarya Purbalingga;Kalikabong;;;0
21071014;PT. Eling Sambas Group;;;;0
21041003;PT Firama Karya;;;;0
26051139;PT. Focon Anggun Karya;;;;0
23071064;PT. Hanmi Hair International;Jl. Gerilya No.99, Karangsambang, Kalikabong, Kec. Kalimanah, Kabupaten Purbalingga, Jawa Tengah;;;0
25111137;PT. Harapan Sawit Lestari;;;;0
22031033;PT Hasta Pustaka;;;;0
2012978;PT. Herba Emas Wahidatama;Kalikabong, Kalimanah;Bu Dede;-;
24031076;PT. Herbatech Innopharma Industry;;;;0
22031032;PT. Holy Sinta Foundation;Jl. Pluit Cantik Blok 04 Barat No.19, Muara Karang-Penjaringan, Jakarta 14450;(021) 66695230;;0
2006969;PT. Hutama Karya;Wirasaba;82231386831;Mas Dimas;
22071046;PT. Hyup Sung Indonesia;l. Raya Padamara Jl. Dusun III No.Km, Dusun 3, Bojanegara, Kec. Padamara;;;0
22071045;PT. Indokores Sahabat Purbalingga;JL Jend A Yani 4 RT 003/04, Kandang Gempang, Purbalingga, 53312, Kandang Gampang, Purbalingga;;;0
21091026;PT. Interwork Indonesia;Jl. Kutabaru, Dusun 1, Patemon, Kec. Bojongsari, Kab. Purbalingga;;;0
1910962;PT. ISS Area Bank Danamon;Rujukan Klinik Tiara Medika Jakara;81314447372;Mba Helmi;
2002967;PT. John Toys Indonesia;Jetis, Kemangkon;81329885180;Mba Afifah;
21071017;PT. KBS International;Jalan Raya Bojong, Toyareka, Kemangkon, Bojong, Kec. Purbalingga, Kabupaten Purbalingga, Jawa Tengah 53381;;;0
2007970;PT. Laju Karunia Jaya;Jakarta;-;-;
25081129;PT. LIDER INDONESIA;;;;0
1803906;PT. Mahkota Tri Angjaya;Jl. Letjend S. Parman, Kedung Menjangan;85747777157;Pak Sapri;
22071047;PT. Majapura ;Bobotsari;;;0
23041056;PT. Mega Jaya Blessindo;Komplek Ruko Botania Garden tahap 7, Kota Batam;;;0
2103998;PT Mekar Armada Jaya;;;;0
22061041;PT. Midas Indonesia;Bojanegara, Padamara;;;0
23051060;PT. Mitra Bisnis Keluarga Ventura;;;;0
1906957;PT. MKTU Sampoerna;Karangjambe, Padamara;Bu Dede;-;
23071068;PT. Mulia Sawit Agro Lestari;;;;0
21071023;PT Nina Venus;;;;0
21041004;PT. Pejagan Pemalang Tol;;;;0
1802903;PT Royal Korindah;Banjaransari, Kembaran Kulon, Purbalingga;82326167696;Bu Esti Agus;
2102991;PT SABA;Purwokerto;-;-;
24041081;PT. Sauhbahtera Samudera;;;;0
23071067;PT. Serasi Gaya Busana Kalimanah;Jl. Raya Mayjen Sungkono, Dusun 1, Kalimanah Wetan, Kec. Kalimanah, Kabupaten Purbalingga, Jawa Tengah;;;0
1808914;PT. Sinar Cendana Abadi;Mewek, Kalimanah, Purbalingga;85647777603;Mba Ita;
23081072;PT. SKS Purbalingga;Dusun I, Jetis, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381;;;0
23061062;PT. Slamet Langgeng (DAVOS);;;;0
2103996;PT SN Jaya Prima;JL. Raya Jetis, Kemangkon, Purbalingga;(0281) 894968;Pak Heri;
24111105;PT. Sophian Indonesia;Jl. Letnan Yusuf No.48, Desa_karangsentul, Karangsentul, Kec. Padamara, Kabupaten Purbalingga;;;0
24121114;PT. Sung Chang Cabang Bobotsari;Dusun 3, Bobotsari, Kec. Bobotsari, Kabupaten Purbalingga, Jawa Tengah 53353;;;0
2101983;PT. Sung Chang Indonesia;Jl. Perintis Kemerdekaan, Mewek, Kalimanah, Purbalingga;Bu Dede;-;
22071044;PT Sung Shim International; Jl. Raya No.3, Kalikabong, Kec. Purbalingga, Kabupaten Purbalingga;;;0
25011116;PT. Sunstarindo Purbalingga;Jl. Kalikabong No. 6 Kalimanah, Purbalingga;;;0
2103997;PT Tirta Agung Wijaya / PT. YORA;Karangranti, Karanggambas, Padamara;;;
21121029;PT. Victoria Beauty Industrial;Jl. Raya Purbalingga Klampok Bajong Bukateja;;;0
22051036;PT. WINTERMAR OFFSHORE MARINE, Tbk;Jakarta;;;0
23071070;PT. Wonjin Indonesia;Desa_karangsentul, Karangsentul, Kec. Padamara, Kabupaten Purbalingga, Jawa Tengah 53372;;;0
1803905;RB Ummi Amanah;Jl. Arjuna 2 No. 151 Wirasana;(0281) 893111 / 082226356999;-;
1802896;RS Harapan Ibu;Jl. Mayjend Soengkono KM.1;8158761531;Mba Hesni;
24071096;RSIA MPH Purbalingga;Jl. Letjen S. Parman No. 56 Purbalingga;;;0
24051089;RSI At Tin Purbalingga;Jl. Raya Mayjend Sungkono No.9 Kalimanah Wetan, Kalimanah, Purbalingga ;;;10
1802898;RSIA Ummuhani;Jl. DI Panjaitan, Purbalingga Lor;85290279434;Mba Rima;
1805911;RSKJ H. MUSTAJAB;Bungkanel, Karanganyar, Purbalingga;8121569008;dr. Fahmi;
1802902;RS. Siaga Medika;Jl. Letnan Sudani, Karangsentul;89630090564;Mba Jeni;
1802897;RSUD Goeteng Taroenadibrata Purbalingga;Wirasana, Purbalingga;81548800604;dr, Minto;
1808913;RSU Nirmala;Jl. Letnan Yusuf, Babakan, Kalimanah;81327244191;Mba Endah;
2102986;RSU PKU Muhammadiyah Purbalingga;Jl. Kolonel Sugiri, Bobotsari;82135840677;Bu Endah;
2009973;Rumah Sakit Islam At - Tin Husada;( JANGAN DIPAKAI )<BR>Jl. Mayjend Sungkono No 09, Kalimanah Wetan, Kalimanah, Purbalingga ;JANGAN DIPAKAI<BR>08386011366;Mba Ifa;10
1811920;SIKES LANUD WIRASABA ;(Jangan dipakai);85878122333;Mba Dinda;
25051121;SMA N 1 Padamara;;;;0
21061011;SMA N 1 Purbalingga;Jl. Letjen MT Haryono, Purbalingga;;;0
25041120;SMK 1 N Purbalingga;;;;0
24121112;SMK N 1 KALIGONDANG ;Dusun 1, Selanegara, Kec. Kaligondang, Kabupaten Purbalingga, Jawa Tengah 53391;;;0
24111111;SMKN 1 Karanganyar;Jl. Raya Bobotsari - Karanganyar Km. 3, Banjarkerta, Kec. Karanganyar, Kab. Purbalingga Prov. Jawa Tengah;;;0
1803907;SMK Negeri 3;Jl. Letjend Sudani, Purbalingga Lor;-;-;
22021030;Telkom Purwokerto;;;;0
21071022;Toko Besi Surya Agung / Bu Novita;Penaruban Kaligondang;;;0
1803904;Toko Mas Nur Putra;Bobotsari;81542941030;Bu Nunung;
21071018;Toko Utami;;;;0
25011117;UDD PMI Kab. Purbalingga;Jl. Tentara Pelajar, Kembaran Kulon, Kec. Purbalingga, Kabupaten Purbalingga;;;0
151203133;umum;-;-;-;
1810916;UPTD RSUD Panti Nugroho;Jl. Soekarno Hatta, Karangmanyar, Kalikabong;Bu Dede;-;
21071015;WKWK Cafe;;;;0
24111106;Zuper Digital Printing;Purwokerto;;;0
`;

const sql = `CREATE TABLE IF NOT EXISTS ref_rekanan (
  id varchar(30) PRIMARY KEY,
  nama varchar(255) NOT NULL,
  alamat text,
  telp varchar(50),
  kontak varchar(100),
  disc numeric(5,2) DEFAULT 0
);
TRUNCATE ref_rekanan;
INSERT INTO ref_rekanan (id, nama, alamat, telp, kontak, disc) VALUES 
` + data.split('\n').slice(1).map(l => {
  const p = l.split(';');
  if(p.length < 5 || !p[0]) return '';
  const clean = s => s ? "'" + s.replace(/'/g, "''") + "'" : 'NULL';
  const discStr = (p[5]||'').replace(',', '.').replace(/[^0-9.]/g, '');
  const disc = discStr ? parseFloat(discStr) : 0;
  return `(${clean(p[0])}, ${clean(p[1])}, ${clean(p[2])}, ${clean(p[3])}, ${clean(p[4])}, ${disc})`;
}).filter(Boolean).join(',\n') + ';';

fs.writeFileSync('sql/44_ref_rekanan.sql', sql);
