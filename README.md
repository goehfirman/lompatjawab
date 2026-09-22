# 🎮 Game Edukasi "Lompat Pilih" untuk Papan Interaktif Digital (PID)

Aplikasi kuis gerak interaktif untuk Papan Interaktif Digital (PID) di sekolah. Siswa menjawab kuis pilihan ganda A/B dengan melompat ke sisi **Kiri (Zona A)** atau sisi **Kanan (Zona B)** di depan kamera PID.

---

## 🌟 Fitur Utama

- **Real-Time Body & Pose Tracking (MoveNet MultiPose)**: Mendeteksi hingga 4 pemain sekaligus secara langsung di browser tanpa instalasi driver khusus.
- **Tampilan Cermin (Horizontal Mirror)**: Gerakan siswa ke kiri fisik = bergerak ke sisi kiri (Zona A) di layar.
- **Manajemen Bank Soal Guru**:
  - Buat, edit, hapus, duplikasi, dan urutkan soal.
  - Pengaturan durasi per soal (5–60 detik).
  - Acak urutan soal dan acak posisi A/B.
  - Ekspor & Impor bank soal dalam format file `.json`.
  - Dilengkapi 3 set soal bawaan siap pakai (IPAS SD, Matematika Seru, Pancasila & Wawasan Kebangsaan).
- **Kontrol Guru Berorientasi PID Touchscreen**:
  - Target sentuh besar (≥ 48 px).
  - Jeda / Lanjut, Ulangi Soal, Lewati Soal, Buka Jawaban Sekarang.
  - **Koreksi Manual Jawaban**: Guru dapat mengoreksi jawaban siswa secara manual jika deteksi meleset sebelum skor dihitung.
- **Audio Synthesizer Mandiri (Web Audio API)**:
  - Efek suara hitung mundur, detak waktu, suara jawaban benar, salah, dan selebrasi konfeti tanpa perlu mengunduh file audio luar (100% offline).
- **Mode Inklusif & Mode Simulasi**:
  - Mode Langkah (tanpa lompatan) untuk inklusivitas siswa.
  - Mode Simulasi / Demo (uji coba tanpa webcam menggunakan keyboard panah Kiri/Kanan atau tombol layar).

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000` (atau port yang tertera pada terminal).

### 2. Membuka di Browser PID
Buka browser (Google Chrome atau Microsoft Edge) pada PID sekolah, arahkan ke alamat lokal tersebut, lalu tekan tombol **Layar Penuh (Fullscreen)** pada pojok kanan atas aplikasi.

---

## ⌨️ Tombol Pintas Pengujian (Keyboard Shortcuts)

Saat dalam pengujian atau mode simulasi:
- **Panah Kiri / Tombol A**: Pindahkan Pemain 1 / Pemain 2 ke Zona A
- **Panah Kanan / Tombol D**: Pindahkan Pemain 1 / Pemain 2 ke Zona B
- **Panah Bawah / Tombol S**: Pindahkan ke Zona Netral
- **Spasi (Space)**: Jeda / Lanjut waktu soal
- **Enter**: Buka jawaban langsung (akhiri timer lebih awal)
