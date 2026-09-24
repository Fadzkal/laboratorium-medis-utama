const fs = require('fs');

const raw = `A0101;Pemeriksaan Fisik;;;A;
A0102;Analisa Cairan Pleura;250000;;A;
A0103;Sekret Vagina;215000;;A;
A0104;Sekret Urethra;215000;;A;
A0105;CITO;25000;;A;
A0106;PA Jaringan Kecil;225000;;A;
A0107;PA Jaringan Sedang;325000;;A;
A0108;PA Jaringan Besar;500000;;A;
A0109;PA Jaringan (Cairan Pleura);225000;;A;
A0111;Kultur dan Resistensi Antibiotik (Vagina);750000;;A;
A0113;Home Service 1;10000;;A;
A0114;Home Service 2;20000;;A;
A0115;Home Service 3;30000;;A;
A0116;CITO 2;600000;;A;
A0117;Pap Smear;250000;;A;
A0118;PA Jaringan Sedang 2;650000;;A;
A0119;Pemeriksaan Fisik;70000;;A;
A0120;PA Jaringan Besar 2;1000000;;A;
A0122;Pap Smear Rujukan;200000;;A;
A0123;PA Jaringan kecil 2;450000;;A;
A0124;Home Service 4;5000;;A;
A0125;;;;A;
A0126;Tes Fisik;70000;;A;
A0127;Home Service 5;25000;;A;
A0128;Home Service 6;15000;;A;
A0129;Mantoux test;;;A;
A0130;Cairan Asites;260000;;A;
A0131;TTNA;650000;;A;
A0132;;;;A;
A0133;Pa Cairan Pleura;350000;;A;
A0134;kultur dahak;750000;;A;
A0135;PA Jaringan Kecil 4;900000;;A;
A0136;Sitologi Cairan;350000;;;
A0137;IVA test;;;;
A0138;Buta Warna;50000;;;
A0140;Pulasan BTA;225000;;;
A0142;Sampling Swab;200000;;A;
A0143;APD;100000;;;
A0144;;;;;
A0145;tensi;;;;
A0146;;;;;
A0147;Biaya Penanganan;75000;;;
A0148;;;;;
A0149;Biaya VTM;25000;;;
A0150;;;;;
A0151;APD + Homeservice;150000;;;
A0152;;;;;
A0153;;;;;
A0154;Sampling;65000;;;
A0155;;;;;
A0156;APD + Home Service;;;;
A0157;;;;;
A0158;USG;560000;;;
A0159;USG Abdomen;320000;;;
A0160;Audiometri;175000;;;
A0161;Spirometri;175000;;;
A0162;Biaya Antar;20000;;;
A0163;Harvard Step Test;55000;A;;
B0101;Chlamydia Pnemonia PCR;475000;;B;
B0102;Chlamydia Trachomatis PCR;475000;;B;
B0103;HBV DNA Kuantitatif;2200000;;B;
B0104;HCV RNA Genotyping;2350000;;B;
B0105;HCV RNA Kuantitatif;1850000;;B;
B0106;M. Tuberculose;500000;;B;
B0107;Salmonella Typhi;0;;B;
B0108;Mycoplasma Pneumonia PCR;465000;;B;
B0109;Toxoplasma Gondii;;;B;
C0101;CITO 4;5000;;;
C0102;Analisa Cairan Pleura/Acites;250000;;C;
E0101;Elektro Kardiografi/EKG;110000;;E;
E0102;Autospirometri;120000;;E;
E0103;Audiogram;0;;E;
E0104;Electroencephalografi / EEG;400000;;E;
E0105;Treadmill;450000;;E;
E0106;Holter Mobitoring;530000;;E;
E0107;TCD;480000;;E;
F0101;Faeces;55000;F;F;
F0102;Benzidine Test;135000;;;
F0103;;;;;
G0101;tes;;;G;
G0102;CITO 4;10000;;G;
G0103;Vitamin D;475000;;;
H0101;Hematologi Lengkap;100000;H;H;
H0102;Hematologi Rutin;90000;;H;
H0106;Golongan Darah ABO;30000;;H;
H0107;Golongan Darah ABO + Rhesus;30000;;H;
H0108;Faal Hemostasis;390000;;H;
H0109;Waktu Pendarahan (BT);35000;;H;
H0110;Waktu Pembekuan (CT);35000;;H;
H0111;Protrombine Time(PT);175000;;H;
H0112;APTT;145000;;H;
H0113;Fibrinogen;400000;;H;
H0114;D-Dimer;700000;;H;
H0115;Trombine Time;0;;H;
H0116;Rektraksi Bekuan;0;;H;
H0117;Viskositas Darah;0;;H;
H0118;Viskositas Plasma;0;;H;
H0119;Retikulosit;110000;;H;
H0120;Serum Iron(Fe);145000;;H;
H0121;Ferritin;400000;;H;
H0122;Transferin;900000;;H;
H0123;Asam Folat;0;;H;
H0124;Coombs Test Direct;0;;H;
H0125;Coombs Test Indirect;0;;H;
H0126;G 6 PDH;0;;H;
H0127;Hb Elektroforesis;0;;H;
H0128;Test Agregasi Trombosit;0;;H;
H0129;BJ Plasma;0;;H;
H0130;CD 4;450000;;H;
H0131;CD 8;0;;H;
H0132;Malaria;0;;H;
H0133;Hb F;0;;H;
H0134;Mikro Filaria;0;;H;
H0135;Resistensi Osmotik;0;;H;
H0136;Rumpell Leede(RL);0;;H;
H0137;Hemoglobin;70000;;H;
H0138;Leukosit;70000;;H;
H0139;Eritrosit;70000;;H;
H0140;Trombosit;70000;;H;
H0141;Hematokrit;70000;;H;
H0142;MCV;70000;;H;
H0143;MCH;70000;;H;
H0144;MCHC;70000;;H;
H0145;Hitung Jenis;65000;;H;
H0146;Morfolgi Darah Tepi;175000;;H;
H0147;TIBC;145000;;H;
H0148;analisa HB ( HPLC );0;;H;
H0149;hapusan sumsum tulang;0;;H;
H0150;LE test;0;;H;
H0151;eosinofil;90000;;H;
H0153;Vaksin Hepatitis;200000;;H;
H0154;Gol darah rhesus;0;;H;
H0155;PROFILE IRON;0;;H;
H0156;Vaksin MMR;0;;H;
H0157;Hapusan Darah;175000;;H;
H0158;LED ( Laju Endap Darah );30000;;H;
H0159;malaria preparat;90000;;H;
H0160;Hematologi Rutin + LED;95000;;H;
H0161;Golongan Darah ABO + Rhesus;30000;;H;
H0162;Vaksin Difteri;95000;;H;
H0163;RA;0;;H;
H0164;;;;H;
H0165;D-Dimer;;;H;
H0166;Fibrinogen;;;H;
H0167;Vaksin Influenza;250000;;H;
H0169;Hitung Jenis;0;;H;
H0170;GDT;175000;;H;
H0171;INR;165000;;H;
H0172;INR (Paket PT, APTT);0;;H;
H0173;Centrifugasi Whole Blood;;;;
H0174;NLR;25000;;;
H0175;Hematologi Lengkap tanpa LED;100000;;;
H0176;;;;;
H0177;RDW-CV;0;H;H;
H0178;Lupus Antikoagulan - 1 (LA-1) ;0;H;H;
H0179;Lupus Antikoagulan - 2 (LA-2);0;H;H;
H0180;Ratio LA;0;H;;
H0181;Hb Elektroforesis;750000;;H;
I0201;HbsAg;85000;;I;
I0202;Anti Hbs;135000;;I;
I0203;Anti HCV;195000;;I;
I0204;Anti HBc;415000;;I;
I0205;Anti HAV;375000;;I;
I0206;T3;250000;;I;
I0207;T4;250000;;I;
I0208;Alpha - Fetoprotein;340000;;I;
I0209;CEA;365000;;I;
I0211;Hbe Ag;625000;;I;
I0212;Anti HBe;675000;;I;
I0213;FT4 N;355000;;I;
I0214;TSH;265000;;I;
I0216;Anti Dengue;260000;;I;
I0219;TPHA;115000;;I;
I0221;VDRL;80000;;I;
I0223;CRP;75000;;I;
I0224;ASTO;75000;;I;
I0225;Tubercolusis;180000;;I;
I0227;Rhematoid Factors;75000;;I;
I0228;Widal;160000;;I;
I0229;Tubex TF;325000;;I;
I0230;Ca 125;590000;;I;
I0231;Ca 15-3;590000;;I;
I0232;Ca 19-9;630000;;I;
I0233;IgE Total;500000;;I;
I0234;NS1 ;300000;;I;
I0235;IgM Anti Toxoplasma;300000;;I;
I0236;IgG Anti Toxoplasma;300000;;I;
I0237;IgM Anti Rubella;360000;;I;
I0238;IgG Anti Rubella;295000;;I;
I0239;IgM Anti CMV;365000;;I;
I0240;IgG Anti CMV;285000;;I;
I0241;IgM Anti HSV 2;475000;;I;
I0242;IgG Anti HSV 2;475000;;I;
I0243;Test Kehamilan;30000;;I;
I0244;Widal 2 Set;45000;;I;
I0245;ICT TB;195000;;I;
I0246;Anti HIV;195000;;I;
I0247;RF;60000;;I;
I0248;VDRL Titer;190000;;I;
I0249;TPHA Titer;295000;;I;
I0250;FT3;395000;;I;
I0251;ANA Test;550000;;I;
I0252;Mantoux Test;160000;;I;
I0253;Anti Hbs Titer;275000;;I;
I0254;TORCH;2150000;;I;
I0255;Aviditas Toxoplasma IgG;700000;;I;
I0256;Aviditas CMV IgG;650000;;I;
I0257;IgM Salmonella Typhi;300000;;;
I0258;Salmonella Typhi;0;;;
I0259;Dengue NS1 Antigen;300000;;;
I0260;;;;;
I0261;FT4 (Jangan dipakai);330000;;;
I0262;Anti Chlamydia trachomatis IgG;1265000;;;
I0263;Anti Chlamydia trachomatis IgG;1265000;;;
I0264;Anti Chlamydia trachomatis IgM;1265000;;;
I0265;Salmonella Typhi;300000;;;
I0266;TSHs;295000;;I;
I0267;HbsAg Titer;225000;;;200000
I0268;ICT Malaria;275000;;;
I0269;IgM Anti HBc;475000;;;
I0270;IgG Anti HSV 1;475000;;;
I0271;IgM Anti HSV 1;475000;;;
I0272;IgM Leptospira;250000;;;
I0273;Beta HCG Kuant. Serum;550000;;;
I0274;IgG ACA;750000;;;
I0275;IgM ACA;750000;;;
I0276;PSA Total;350000;;;
I0277;Rapid Test Antibodi Anti SARS cov-2;120000;;;
I0278;Syphilis;0;;;
I0279;Antigen SARS CoV-2;110000;;;
I0280;Rapid Syphilis;95000;;;
I0282;hs-CRP;290000;;;
I0283;;;;;
I0284;Amilase;300000;;;
I0285;Anti SARS-CoV 2 Kuantitatif;250000;;;
I0286;Dengue Duo;380000;I;I;
I0287;Free PSA;700000;;;
I0288;CRP Titer;260000;I;I;
I0289;Asto Titer;195000;;I;
I0290;Tes HIV Konfirmasi;55000;I;I;
I0291;;;;;
I0292;RPR (Rapid Plasma Reagin) Syphilis;75000;IS;;
I0293;ANA IF;950000;;I;
I0294;ANA Profile;1250000;I;;
I0295;Hormon;825000;I;;
I0296;;;;;
I0297;Human Growth Hormon;825000;;;
I0298;;;;;
K0301;Cholesterol Total;60000;;K;
K0302;Cholesterol LDL;100000;;K;
K0303;Cholesterol HDL;70000;;K;
K0304;Trigliserida;65000;;K;
K0305;CK;275000;;C;
K0306;CK-MB;275000;;C;
K0307;SGOT;60000;;K;
K0308;SGPT;60000;;K;
K0309;Gamma GT;120000;;K;
K0311;Alkaline Fosfatase;0;;K;
K0312;LDH;215000;;C;
K0314;Kalium;80000;;K;
K0315;Natrium;80000;;K;
K0316;Chlorida;80000;;K;
K0317;Bilirubin Total;70000;;K;
K0318;Bilirubin Direct;70000;;K;
K0319;Total Protein;80000;;K;
K0321;Albumin;80000;;K;
K0322;Globulin;70000;;K;
K0325;Cholinesterase;75000;;K;
K0326;Glukosa Darah Puasa;30000;;K;
K0327;Glukosa Darah 2 Jam PP;30000;;K;
K0328;Glukosa Darah Sewaktu;30000;;K;
K0329;Ureum;60000;;K;
K0331;Creatinin;60000;;K;
K0332;Asam Urat;55000;;K;
K0333;Amylase;0;;K;
K0334;Lipase;0;;K;
K0335;HbA 1C;185000;;C;
K0336;Troponin I;365000;;C;
K0337;tes;;;K;
K0338;SGOT;0;;K;
K0339;SGPT;0;;K;
K0340;Kalsium;110000;;K;
K0341;Elektrolit;225000;;K;
K0342;Elektrolit;;;K;
K0343;Bilirubin Indirect;0;;K;
K0344;Alkali Fosfatase;105000;;K;
K0346;Microalbumin;0;;K;
K0347;Rasio LDL/HDL;0;;;
K0348;Magnesium;160000;;;
K0349;;;;;
K0350;rasio Cholesterol/HDL;;;;
K0351;Cairan Pleura / Ascites;250000;;K;
K0352;Vitamin D;475000;;;
K0353;Vitamin D;;;;
K0354;;;;;
K0355;;;;;
K0356;eGFR;50000;K;K;
K0357;Procalcitonin;830000;K;K;
K0358;C-Peptide;600000;K;;
K0359;Fosfor Anorganik;150000;K;;
K0360;FSH;450000;;;
K0361;percobaan;;;;
M0101;Kultur Gal;750000;;M;
M0102;Kultur BTA;750000;;M;
M0103;Kultur GO;750000;;M;
M0104;Kultur Diphteri;750000;;M;
M0105;Kultur Fungi;750000;;M;
M0107;Uji Resistensi;0;;M;
M0108;Kultur Anaerob;0;;M;
M0109;Preparat Gram;95000;;M;
M0110;Preparat BTA;195000;;M;
M0111;Preparat GO;180000;;M;
M0112;Preparat Diphteri;115000;;M;
M0113;Preparat Fungi;60000;;M;
M0114;Preparat Trichomonas;50000;;M;
M0115;Preparat Candida;60000;;M;
M0116;Preparat Chlamydia;65000;;M;
M0117;Kultur Urine;750000;;M;
M0118;Kultur Faeces;750000;;M;
M0119;Kultur Darah;750000;;M;
M0120;Kultur Gall;750000;;M;
M0121;Kultur Sputum;750000;;M;
M0122;Malaria;0;;M;
M0123;Trichomonas;50000;;M;
M0124;Kultur Cholera;0;;M;
M0125;Kultur Pus;750000;;M;
M0126;Preparat BTA;65000;;M;
M0127;FNAB;550000;;M;
M0128;Ritz Serum;225000;;M;
M0130;Kultur MO;750000;;M;
M0131;BTA 1 seri;65000;;M;
M0132;BTA sputum pagi;60000;;M;
M0133;Preparat BTA;150000;;M;
M0134;Preparat BTA;67500;;;
M0136;Preparat BTA;;;;
M0137;DIPTHERI;115000;;;
M0138;Kultur Cairan CAPD;750000;;;
M0139;Sitologi Sputum;350000;;;
M0140;Kultur Darah 2;1500000;;;
M0141;Kultur Cairan Sendi;750000;;;
M0142;Preparat MO;50000;;;
M0143;kultur ujung kanul;750000;;;
M0144;;;;;
M0145;Rectal Swab;600000;;;
M0146;Kultur Cairan Pleura;540000;;;
M0147;;;;;
M0148;IGRA;1000000;;;
M0149;Kultur Sekret Vagina;550000;;;
M0150;Pengecatan slide Difteri;180000;M;;
P0101;Dengue Test IgG;0;P;P;
P0102;Dengue Test IgM;0;P;P;
P0103;Helicobacter Pylori;850000;P;P;
P0104;ICT Malaria;0;P;P;
P0105;ICT TB;0;P;P;
P0106;IgM Salmonella (SPOT Typhi);0;P;P;
P0107;RT PCR Covid-19;0;;P;
P0108;SARS-CoV-2 RNA;900000;;;
P0109;SARS-CoV-2 RNA;900000;P;;
P0110;PCR - Covid-19;0;P;;
P0111;RT PCR Covid-19;275000;;;
R0101;Ankle;200000;;R;42000
R0104;BOF/BNO;0;;R;0
R0105;Basis Crani;0;;R;0
R0110;Cervical AP /  Lat;260000;;R;48000
R0113;Clavicula;160000;;R;24000
R0114;Cruris;200000;;R;42000
R0119;Genu;200000;;R;42000
R0120;Humerus Dex AP/LAT;190000;;R;42000
R0122;Lumbosacral AP/LAT;260000;;R;48000
R0123;Mandibula AP;380000;;R;0
R0124;Manus;200000;;R;42000
R0127;Pelvis A.P;160000;;R;24000
R0134;Shoulder Dex;200000;;R;42000
R0137;Spot Nasal Lat;0;;R;0
R0144;Thorax AP;160000;;R;24000
R0167;Sinus paranasalis;310000;;R;48000
R0170;Thoraco Lumbalis AP/LAT;260000;;R;48000
R0181;ARTC.Cubiti;0;;R;0
R0186;Abdomen 3 Posisi;345000;;R;
R0187;Coccyx;0;;R;0
R0188;Elbow Joint D/S;200000;;R;42000
R0189;Femur D/S;200000;;R;42000
R0190;Gigi;80000;;R;0
R0191;Thorax PA;160000;;R;24000
R0192;Thorax AP Lat;310000;;R;48000
R0193;Tes;0;;R;0
R0195;2 Gigi;160000;;R;0
R0196;3 Gigi;240000;;R;0
R0197;4 Gigi;320000;;R;0
R0198;Pedis;200000;;R;42000
R0199;Abdomen;160000;;R;24000
R0201;Wrist Joint;200000;;R;42000
R0202;Antebrachi;200000;;R;42000
R0203;Cranium;310000;;R;48000
R0204;Nasal;160000;;R;24000
R0205;Elbow;0;;R;0
R0206;Vert. Lumbal;260000;;R;48000
R0207;Humerus Sin AP/Lat;190000;;R;42000
R0208;BNO;;;R;
R0209;HNP;;;R;
R0210;Scapula;160000;;R;24000
R0211;Genu 2;400000;;R;
R0212;sculer kanan;145000;;R;24000
R0213;sculer kiri;145000;;R;24000
R0214;Cranium AP;0;;R;24000
R0215;Genu D;200000;;R;42000
R0216;Genu S;200000;;R;42000
R0217;Wrist Joint S;200000;;R;42000
R0218;Manus S;200000;;R;42000
R0219;Pelvis AP;160000;;R;24000
R0220;;;;R;
R0221;Wrist 1 posisi;140000;;R;24000
R0222;Thorax AP + Abdomen;310000;;R;
R0223;Waters;145000;;;
R0224;Thorax PA+Lat;310000;;;
R0225;;;;;
R0226;pedis d+s;;;;
R0227;Ankle Dextra ;200000;;;
R0228;Ankle Sinistra ;200000;;;
R0229;Pedis Dextra ;;;;
R0230;Pedis Sinistra;;;;
R0231;Cruris Dextra ;;;;
R0232;Cruris Sinistra ;;;;
R0233;Genu Dextra ;;;;
R0234;Genu Sinistra ;;;;
R0235;Manus Dextra ;;;;
R0236;Manus Sinistra ;;;;
R0237;Wrist Dextra ;200000;;;
R0238;Vert. Lumbal AP;0;;;
R0239;Hip Joint D/S;200000;;;
R0240;Shoulder Sin;200000;;;
R0241;Sacrum;260000;;;
S0101;;;;S;
S0102;Sperma Analisa;250000;A;S;
U0101;Urine Lengkap;45000;;U;
U0102;Glukosa Urine;25000;;U;
U0103;Protein Urine;25000;;U;
U0104;Protein Esbach;75000;;U;
U0105;Bence Jones Protein;90000;;U;
U0106;Mikroalbumin Urine;180000;;U;
U0107;Urobilinogen;20000;;U;
U0108;Bilirubin;0;;U;
U0110;Nitrit Urine;40000;;U;
U0111;PH Urine;40000;;U;
U0112;BJ Urine;40000;;U;
U0113;Sedimen;30000;;U;
U0114;Protein Urine(Kuantitatif);0;;U;
U0115;Magnesium;0;;U;
U0116;Elektroforesis Urine;275000;;U;
U0117;Beta HCG Latex Urine;0;;U;
U0118;Beta HCG Test Pack Urine;0;;U;
U0119;Beta HCG Kuant. Urine;520000;;U;
U0120;Amphetamine;60000;;U;
U0122;Benzodiazepine;60000;;U;
U0123;Oplat/Morphine;50000;;U;
U0124;Canabinoid;60000;;U;
U0125;Coccain;60000;;U;
U0126;Metamphetamine;60000;;U;
U0127;Ganja/Marijuana;50000;;U;
U0128;Darah Samar;115000;;U;
U0129;Feses Rutin;0;;U;
U0130;Darah Samar/Bensidin;0;;U;
U0131;Pencernaan;40000;;U;
U0132;Stercobilin;55000;;U;
U0133;pH Feses;35000;;U;
U0134;vit B12;1750000;;U;
U0135;Urine Rutin;35000;;U;
U0136;Tes HCG Urine;0;;U;
U0137;Cannabinoid;50000;;U;
U0139;Opiat/Morphine;60000;;U;
U0140;Glukosa Urine 2 Jam PP;25000;;;
U0141;;;;;
U0142;;;;;
U0143;;;;;
U0144;Narkoba;300000;UL;;
U0145;Alkohol Urine;200000;UL;;
U0146;;;;;
U0147;USG Protat;410000;;;
U0148;;;;;
U0149;USG Prostat;410000;;;
W0101;Widal Test;0;W;W;`;

let outSql = 'BEGIN;\n\n';
outSql += `-- Hapus duplikat tarif LAB yang mungkin tercipta akibat script sebelumnya\n`;
outSql += `DELETE FROM kasir_tarif a USING (\n`;
outSql += `    SELECT MIN(id) as min_id, kode\n`;
outSql += `    FROM kasir_tarif\n`;
outSql += `    WHERE jenis = 'LAB'\n`;
outSql += `    GROUP BY kode HAVING COUNT(*) > 1\n`;
outSql += `) b\n`;
outSql += `WHERE a.kode = b.kode AND a.jenis = 'LAB' AND a.id <> b.min_id;\n\n`;

for (let line of raw.split('\n')) {
  line = line.trim();
  if (!line || line.startsWith('pc_')) continue;
  let cols = line.split(';');
  let kode = cols[0];
  let nama = cols[1];
  let harga = parseInt(cols[2]) || 0;
  let barcode = cols[3] || null;
  let grup = cols[4] || null;
  let jasmed = parseInt(cols[5]) || 0;
  
  if (kode) {
    if (harga > 0) {
      // kasir_tarif doesn't have a unique constraint on kode.
      // We use an UPDATE then an INSERT WHERE NOT EXISTS logic.
      outSql += `UPDATE kasir_tarif SET tarif = ${harga} WHERE jenis = 'LAB' AND kode = '${kode}';\n`;
      outSql += `INSERT INTO kasir_tarif (jenis, kode, nama, tarif, aktif) SELECT 'LAB', '${kode}', '${nama.replace(/'/g, "''")}', ${harga}, true WHERE NOT EXISTS (SELECT 1 FROM kasir_tarif WHERE jenis = 'LAB' AND kode = '${kode}');\n`;
    }
    
    // Update ref_lab
    let updates = [];
    if (barcode) updates.push(`barcode = '${barcode}'`);
    if (grup) updates.push(`grup_cn = '${grup}'`);
    if (jasmed > 0) updates.push(`jasmed = ${jasmed}`);
    
    if (updates.length > 0) {
        outSql += `UPDATE ref_lab SET ${updates.join(', ')} WHERE kode = '${kode}';\n`;
    }
  }
}

outSql += '\nCOMMIT;\n';
fs.writeFileSync('c:/lab_utama/rme-lab-utama/sql/47_seeding_harga_lab.sql', outSql);
console.log('Done generating sql/47_seeding_harga_lab.sql');
