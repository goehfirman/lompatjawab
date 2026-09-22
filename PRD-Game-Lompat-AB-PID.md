# PRD — Game Edukasi "Lompat Pilih" untuk Papan Interaktif Digital (PID)

| | |
|---|---|
| **Nama kerja produk** | Lompat Pilih (working title) |
| **Platform** | Web app yang dijalankan di browser PID |
| **Jenjang sasaran awal** | Sekolah Dasar (dirancang fleksibel untuk semua kelas) |
| **Status dokumen** | Draft v0.1 |
| **Tanggal** | 21 September 2026 |

---

## 1. Ringkasan Produk

Lompat Pilih adalah game kuis berbasis gerak untuk PID. Sebuah soal dengan dua pilihan jawaban (A dan B) tampil di layar. Layar dibagi dua (split screen) dan kamera PID menyala, sehingga siswa terlihat langsung di layar. Siswa menjawab dengan **melompat ke sisi kiri (A) atau sisi kanan (B)**. Sistem membaca posisi siswa melalui kamera, menentukan jawabannya, lalu menampilkan kunci jawaban, skor, dan penjelasan.

Seluruh soal **diinput manual oleh guru sebelum permainan dimulai**, sehingga game bisa dipakai untuk mata pelajaran, topik, dan kelas apa pun.

## 2. Latar Belakang dan Masalah

- PID sering hanya dipakai sebagai layar proyeksi biasa; fitur interaktifnya kurang dimanfaatkan.
- Kuis di kelas cenderung membuat siswa duduk dan pasif, dan hanya siswa yang ditunjuk yang terlibat.
- Siswa SD belajar lebih baik ketika ada gerak fisik, unsur permainan, dan umpan balik langsung.
- Guru butuh alat kuis yang **mudah disiapkan (tanpa coding)** dan **tidak memerlukan perangkat tambahan per siswa** (HP, kartu jawaban, dsb.).

## 3. Tujuan dan Indikator Keberhasilan

### Tujuan
1. Meningkatkan keterlibatan aktif siswa saat latihan/penguatan materi.
2. Memberi guru cara cepat membuat dan menjalankan kuis gerak tanpa alat tambahan.
3. Memberi umpan balik instan (benar/salah + penjelasan) sehingga miskonsepsi bisa dibahas seketika.

### Indikator keberhasilan (target awal, disesuaikan setelah uji coba)
| Indikator | Target |
|---|---|
| Waktu guru membuat satu set 10 soal | ≤ 5 menit |
| Waktu dari membuka aplikasi sampai soal pertama tampil (termasuk kalibrasi) | ≤ 2 menit |
| Akurasi penentuan zona kiri/kanan pada kondisi kelas normal | ≥ 95% |
| Kecepatan tampilan kamera di PID sasaran | ≥ 15 fps |
| Guru menyatakan game layak dipakai ulang (survei pilot) | ≥ 80% |

## 4. Pengguna Sasaran

**Guru (pengguna utama/pembuat konten)**
- Mengelola soal, memulai permainan, mengendalikan alur dengan layar sentuh PID.
- Tidak harus mahir teknologi.

**Siswa (pemain)**
- Berinteraksi hanya dengan gerak tubuh di depan kamera; tidak perlu akun atau perangkat pribadi.
- Bermain per giliran/kelompok kecil, sementara siswa lain menjadi penonton, penebak, atau pencatat skor.

## 5. Ruang Lingkup

### Masuk dalam rilis pertama (MVP)
- Input dan penyimpanan soal secara manual oleh guru.
- Permainan A/B dengan split screen dan kamera.
- Deteksi posisi/lompatan siswa di zona kiri atau kanan.
- Timer, skor, kunci jawaban, penjelasan, dan layar hasil.
- Kontrol guru selama permainan (jeda, lanjut, koreksi manual).

### Di luar cakupan MVP (kemungkinan rilis berikutnya)
- Lebih dari dua pilihan jawaban (A/B/C/D).
- Impor soal dari Excel/CSV atau pembuatan soal otomatis dengan AI.
- Akun guru, sinkronisasi antar-perangkat, dan berbagi bank soal antar guru.
- Mode multi-perangkat (siswa bermain dari HP).
- Rekam video permainan.

## 6. Alur Pengguna (User Flow)

1. **Persiapan (guru, sebelum kelas)** — Buka aplikasi → buat set soal baru → isi soal, pilihan A/B, kunci jawaban, (opsional) gambar dan penjelasan → simpan.
2. **Mulai permainan** — Guru memilih set soal → mengatur opsi permainan (waktu per soal, jumlah pemain, mode gerak).
3. **Kalibrasi** — Kamera menyala, sistem menampilkan garis tengah dan zona kiri/kanan. Sistem mendeteksi pemain; guru memastikan semua pemain terdeteksi dan berdiri di area yang benar.
4. **Hitung mundur** — 3 – 2 – 1.
5. **Soal tampil** — Soal dan dua pilihan tampil; timer berjalan; siswa melompat ke kiri (A) atau kanan (B).
6. **Kunci jawaban** — Saat waktu habis, jawaban setiap pemain dikunci berdasarkan zonanya.
7. **Pengungkapan** — Layar menampilkan jawaban benar, siapa yang benar/salah, dan penjelasan (jika ada).
8. **Skor** — Skor diperbarui, lalu lanjut ke soal berikutnya.
9. **Hasil akhir** — Papan skor, rekap per soal (soal mana yang paling banyak salah), tombol main lagi / ganti pemain.

## 7. Kebutuhan Fungsional

Prioritas: **P0** = wajib MVP, **P1** = sebaiknya ada, **P2** = tahap berikutnya.

### 7.1 Manajemen Soal (Sisi Guru)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | Guru dapat membuat set soal dengan judul, mata pelajaran, dan kelas/topik (label). | P0 |
| F-02 | Setiap soal memiliki: teks soal, teks pilihan A, teks pilihan B, dan kunci jawaban (A atau B). | P0 |
| F-03 | Setiap soal dapat diberi gambar (opsional). | P1 |
| F-04 | Setiap soal dapat diberi penjelasan singkat yang tampil setelah jawaban dibuka (opsional). | P1 |
| F-05 | Guru dapat mengedit, menghapus, menduplikasi, dan mengurutkan ulang soal. | P0 |
| F-06 | Guru dapat mengatur waktu per soal (default 10 detik; rentang 5–60 detik), baik untuk seluruh set maupun per soal. | P0 |
| F-07 | Opsi "acak urutan soal". | P1 |
| F-08 | Opsi "tukar posisi A/B secara acak" agar kunci jawaban tidak selalu di sisi yang sama; kunci tetap ditampilkan dengan benar. | P1 |
| F-09 | Peringatan bila kunci jawaban terlalu berat sebelah (mis. >70% soal berkunci sama). | P2 |
| F-10 | Set soal tersimpan otomatis di perangkat (tanpa perlu login) dan dapat diekspor/diimpor sebagai berkas (mis. JSON) untuk cadangan atau pindah perangkat. | P0 |
| F-11 | Pratinjau soal persis seperti tampilan di layar permainan. | P1 |
| F-12 | Validasi: soal tidak bisa disimpan/dimainkan jika teks soal, pilihan A/B, atau kunci jawaban kosong. | P0 |
| F-13 | Impor soal dari CSV/Excel. | P2 |

### 7.2 Tampilan Permainan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-20 | Layar penuh dengan umpan kamera sebagai latar; **tampilan cermin (mirror)** sehingga kiri siswa = kiri layar. | P0 |
| F-21 | Layar dibagi dua dengan garis tengah jelas: **sisi kiri = A**, **sisi kanan = B**; setiap sisi memiliki warna dan huruf besar yang kontras (tidak mengandalkan warna saja). | P0 |
| F-22 | Teks soal tampil di bagian atas tengah layar, dengan ukuran huruf terbaca dari belakang kelas (target ≥ 3–4 m). Teks pilihan A dan B tampil di masing-masing sisi. | P0 |
| F-23 | Timer visual (bar atau lingkaran) dan angka hitung mundur; efek suara pada 3 detik terakhir. | P0 |
| F-24 | Indikator kerangka/kotak pada setiap pemain terdeteksi, dengan warna berubah sesuai zona saat ini (sehingga siswa melihat "aku sedang di A/B"). | P0 |
| F-25 | Saat jawaban dibuka: zona benar disorot, zona salah diredupkan, serta animasi/ikon benar–salah pada tiap pemain. | P0 |
| F-26 | Efek suara dan musik latar yang dapat dimatikan. | P1 |
| F-27 | Zona netral di sekitar garis tengah (mis. ±8% lebar layar): pemain yang berada di zona ini saat waktu habis dianggap **tidak menjawab**. | P0 |

### 7.3 Deteksi Gerak dan Penentuan Jawaban

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-30 | Sistem mendeteksi tubuh pemain melalui kamera secara real-time (pose estimation di perangkat). | P0 |
| F-31 | Posisi pemain ditentukan dari titik tengah tubuh (mis. pinggul/torso) terhadap garis tengah layar. | P0 |
| F-32 | Jawaban pemain = **zona tempat pemain berada saat timer habis** (dikunci). Selama waktu berjalan, pemain boleh berpindah untuk mengubah jawaban. | P0 |
| F-33 | Opsi "kunci saat lompatan pertama": jawaban dikunci begitu lompatan terdeteksi (opsional, lebih menantang tapi lebih rentan salah deteksi). | P2 |
| F-34 | Mendukung 1–4 pemain sekaligus dalam satu bingkai kamera (target MVP); jawaban dan skor dihitung per pemain. | P0 |
| F-35 | Pada kalibrasi, setiap pemain diberi slot (Pemain 1, 2, …) dan dapat diberi nama/panggilan singkat oleh guru; sistem menjaga slot selama satu ronde. | P0 |
| F-36 | Jika pemain hilang dari bingkai, sistem menampilkan peringatan dan memberi guru opsi jeda. | P1 |
| F-37 | **Koreksi manual oleh guru**: guru dapat mengubah jawaban seorang pemain (A/B/tidak menjawab) sebelum skor dihitung, jika deteksi keliru. | P0 |
| F-38 | Mode gerak alternatif untuk inklusivitas dan keselamatan: **"Mode langkah"** (melangkah, bukan melompat) dan **"Mode berdiri di sisi"**. Penilaian tetap berbasis zona. | P1 |

### 7.4 Kontrol Guru Selama Permainan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-40 | Tombol jeda/lanjut, lewati soal, dan ulangi soal. | P0 |
| F-41 | Tombol "buka jawaban sekarang" (mengakhiri timer lebih awal). | P1 |
| F-42 | Tombol "ganti pemain / giliran berikutnya" tanpa mengulang set soal. | P0 |
| F-43 | Semua kontrol dapat dioperasikan dengan sentuhan pada PID (target sentuh besar, minimal 48 px). | P0 |
| F-44 | Guru dapat keluar ke menu utama dengan konfirmasi (mencegah tersentuh tak sengaja). | P0 |

### 7.5 Skor dan Hasil

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-50 | Skor per soal: benar = +10 poin (default); salah/tidak menjawab = 0. Nilai poin dapat diatur guru. | P0 |
| F-51 | Skor tampil di layar untuk setiap pemain selama permainan. | P0 |
| F-52 | Layar hasil akhir: peringkat/skor pemain, jumlah benar–salah, dan apresiasi (mis. animasi konfeti; hindari pembandingan yang mempermalukan siswa berskor rendah). | P0 |
| F-53 | Rekap per soal: persentase pemain yang menjawab benar, agar guru tahu materi yang perlu diulang. | P1 |
| F-54 | Ekspor rekap hasil (mis. gambar/PDF/CSV). | P2 |
| F-55 | Bonus kecepatan atau streak jawaban benar. | P2 |

## 8. Kebutuhan Non-Fungsional

**Kinerja**
- Umpan kamera dan overlay berjalan ≥ 15 fps di PID sasaran; latensi dari gerakan ke perubahan indikator zona ≤ 300 ms.
- Aplikasi termuat ≤ 5 detik pada koneksi sekolah biasa; setelah pemuatan pertama dapat berjalan **offline** (mis. sebagai PWA) karena koneksi internet sekolah tidak selalu stabil.

**Privasi dan keamanan data anak**
- **Video kamera diproses sepenuhnya di perangkat; tidak direkam, tidak disimpan, dan tidak dikirim ke server mana pun.**
- Tidak ada akun siswa; nama pemain hanya panggilan/inisial yang diketik guru dan tidak dikirim keluar perangkat.
- Izin kamera diminta secara eksplisit, dan ada indikator jelas ketika kamera aktif.
- Soal dan data set tersimpan lokal di perangkat.

**Keselamatan fisik**
- Sebelum permainan, aplikasi menampilkan pengingat: area bebas rintangan, lantai tidak licin, jarak antar-pemain memadai, siswa boleh melepas sepatu bila lantai licin.
- Rekomendasi area bermain: lebar minimal ±3–4 m dan jarak dari kamera ±2–3 m (disesuaikan setelah uji lapangan).
- Durasi ronde per kelompok dibatasi (saran default: maksimal 10 soal per giliran) agar siswa tidak kelelahan.

**Aksesibilitas dan inklusivitas**
- Kontras tinggi; huruf besar; pilihan A/B dibedakan warna **dan** huruf/bentuk.
- Mode langkah tersedia bagi siswa yang tidak nyaman/tidak dapat melompat; siswa boleh menjadi pembaca soal, pencatat, atau penilai.

**Kompatibilitas**
- Berjalan di browser modern (Chrome/Edge) pada PID berbasis Android atau Windows. Spesifikasi PID sekolah perlu dipastikan pada tahap awal (lihat Pertanyaan Terbuka).

**Keandalan**
- Bila kamera gagal/ditolak, aplikasi menampilkan panduan pemulihan yang jelas, bukan layar kosong.
- Pemain dapat dilanjutkan setelah jeda tanpa kehilangan skor.

## 9. Pendekatan Teknis (Usulan)

| Aspek | Usulan |
|---|---|
| Aplikasi | Web app (HTML/JS), dapat dipasang sebagai PWA |
| Akses kamera | WebRTC `getUserMedia`, ditampilkan dengan mirror horizontal |
| Deteksi tubuh | Pose estimation berjalan di browser, mis. MediaPipe Pose atau TensorFlow.js MoveNet (varian multi-pose bila memerlukan >1 pemain) |
| Penentuan zona | Rata-rata titik pinggul/bahu dinormalisasi terhadap lebar bingkai; dibandingkan garis tengah + zona netral; dihaluskan dengan rata-rata bergerak beberapa frame untuk mengurangi getaran |
| Deteksi lompatan | Opsional (P2): perubahan vertikal cepat titik pinggul/pergelangan kaki; tidak dijadikan dasar penilaian MVP |
| Penyimpanan | IndexedDB/localStorage; ekspor/impor JSON |
| Antarmuka | Layout responsif layar lebar (16:9), target sentuh besar |

**Keputusan desain penting:** penilaian didasarkan pada **posisi saat timer habis**, bukan pada pengenalan gerakan "lompat" yang sempurna. Ini jauh lebih andal di kondisi kelas nyata (pencahayaan bervariasi, banyak siswa, gerakan cepat), dan lompatan tetap menjadi aksi fisik yang dilakukan siswa.

## 10. Kriteria Penerimaan (Contoh untuk Fitur Kunci)

**Input soal (F-01, F-02, F-12)**
- Guru dapat membuat set berisi 10 soal, menyimpannya, menutup aplikasi, membukanya lagi, dan set masih ada.
- Soal dengan kunci jawaban kosong tidak dapat dimainkan dan menampilkan pesan kesalahan yang jelas.

**Split screen dan cermin (F-20, F-21)**
- Ketika siswa melangkah ke kiri fisiknya, indikator siswa bergerak ke sisi kiri layar (sisi A).
- Garis tengah dan label A/B terlihat jelas dari jarak 4 m pada PID sasaran.

**Penentuan jawaban (F-27, F-32, F-37)**
- Pemain yang berdiri jelas di sisi kiri saat timer habis dicatat menjawab A; di sisi kanan dicatat B; di zona netral dicatat "tidak menjawab".
- Guru dapat mengubah jawaban pemain sebelum skor final tampil, dan skor mengikuti perubahan tersebut.

**Privasi (non-fungsional)**
- Pemeriksaan lalu lintas jaringan saat permainan berlangsung tidak menunjukkan pengiriman frame video atau data pose ke luar perangkat.

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| PID sekolah berspesifikasi rendah sehingga pose detection patah-patah | Pengalaman buruk, jawaban salah terbaca | Uji prototipe di PID nyata sejak awal; sediakan model lebih ringan dan opsi resolusi kamera rendah |
| Kamera PID sudut sempit atau letak tinggi | Siswa tidak terlihat utuh | Panduan penempatan area bermain; layar kalibrasi menampilkan batas area |
| Pencahayaan buruk atau silau jendela | Deteksi tidak stabil | Petunjuk pencahayaan; koreksi manual guru |
| Siswa saling menutupi (banyak pemain) | Slot pemain tertukar | Batasi 1–4 pemain per ronde; guru dapat mengoreksi manual |
| Cedera karena melompat | Keselamatan siswa | Pengingat keselamatan, mode langkah, batasi durasi giliran |
| Tebakan 50% pada soal A/B mengurangi nilai asesmen | Skor tidak mencerminkan pemahaman | Pakai untuk latihan/penguatan (bukan penilaian formal); wajibkan penjelasan pada soal penting; acak posisi kunci; gunakan soal berbentuk pernyataan benar/salah atau pilihan dengan pengecoh menarik |
| Kekhawatiran privasi orang tua/sekolah | Penolakan penggunaan | Komunikasikan bahwa video tidak direkam maupun dikirim; tidak ada akun siswa |

## 12. Rencana Rilis

| Fase | Fokus | Hasil |
|---|---|---|
| **0. Uji kelayakan** | Prototipe kamera + pose detection + garis tengah di PID sekolah sesungguhnya | Kepastian performa dan akurasi zona |
| **1. MVP** | Input soal, permainan A/B, split screen, skor, kontrol guru, koreksi manual | Bisa dipakai satu kelas |
| **2. Uji coba (pilot)** | Dipakai di 1–2 kelas selama 2–4 minggu | Umpan balik guru dan siswa, perbaikan akurasi |
| **3. Penyempurnaan** | Gambar/penjelasan, mode langkah, rekap per soal, ekspor | Rilis stabil |
| **4. Pengembangan lanjutan** | Impor CSV, A/B/C/D, bank soal bersama | Sesuai hasil pilot |

## 13. Pertanyaan Terbuka

1. **Spesifikasi PID sekolah**: sistem operasi (Android/Windows), browser, RAM/prosesor, letak dan sudut kamera?
2. **Jumlah pemain per giliran**: cukup 1–4 pemain, atau kelas ingin bermain sekaligus (mis. 10+ siswa dalam satu bingkai)? Semakin banyak pemain, semakin sulit pelacakan individu.
3. **Skor individu atau tim?** Apakah tiap siswa dinilai sendiri, atau kelompok menjawab dengan kesepakatan/suara terbanyak?
4. **Penentuan jawaban**: apakah cukup memakai posisi saat waktu habis (usulan), atau guru ingin siswa harus benar-benar melompat?
5. **Ruang gerak kelas**: apakah area depan PID cukup lebar (±3–4 m) dan aman untuk melompat?
6. **Kebutuhan tampilan**: apakah perlu identitas visual/tema tertentu (mis. sesuai tema projek sekolah)?
7. **Penggunaan hasil**: hanya untuk latihan seru, atau rekap hasil juga akan dipakai sebagai bahan asesmen formatif?

---

*Dokumen ini adalah draf awal dan akan diperbarui setelah uji kelayakan pada PID sekolah dan masukan dari guru.*
