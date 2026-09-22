import React, { useState } from 'react';
import { 
  Plus, Trash2, Copy, ArrowUp, ArrowDown, Download, Upload, Eye, 
  Check, AlertTriangle, Clock, Shuffle, BookOpen, Layers, X, Image as ImageIcon,
  Sparkles, Clipboard, CheckCheck, Cloud, Database, RefreshCw, Server,
  CheckCircle, AlertCircle, HelpCircle
} from 'lucide-react';
import { exportSetToJson, parseImportedJson } from '../utils/storage';

export const CHATGPT_PROMPT_TEMPLATE = `Kamu adalah asisten guru yang ahli membuat kuis interaktif untuk siswa sekolah dasar.
Tolong buatkan set soal kuis pilihan ganda 2 opsi (A dan B) untuk permainan gerak "Lompat Pilih" PID dengan topik: [TULIS TOPIK/MATERI DI SINI, contoh: Rantai Makanan Kelas 5 SD].

Jumlah soal: 10 soal
Format output HARUS HANYA berupa JSON murni tanpa teks pengantar atau penutup, dengan struktur berikut:

{
  "title": "Judul Kuis (contoh: IPAS: Rantai Makanan)",
  "subject": "Mata Pelajaran (contoh: IPAS / Matematika / PPKn)",
  "grade": "Kelas (contoh: SD Kelas 5)",
  "timerSeconds": 10,
  "randomizeQuestions": false,
  "shuffleChoices": false,
  "questions": [
    {
      "text": "Teks pertanyaan yang jelas, ringkas, dan mudah dibaca anak-anak",
      "choiceA": "Pilihan Jawaban A (singkat & padat)",
      "choiceB": "Pilihan Jawaban B (singkat & padat)",
      "correctAnswer": "A",
      "explanation": "Penjelasan singkat 1-2 kalimat mengapa jawaban tersebut benar."
    }
  ]
}

Aturan penting:
1. Pilihan hanya ada 2: "choiceA" dan "choiceB".
2. "correctAnswer" bernilai "A" atau "B". Seimbangkan jumlah kunci jawaban A dan B.
3. Teks pertanyaan dan pilihan jawaban dibuat singkat agar mudah dibaca dari kejauhan di layar besar.
4. "explanation" adalah pembahasan singkat untuk dijelaskan guru kepada siswa setelah waktu habis.
5. Hanya berikan format JSON yang valid.`;

export function QuestionManager({
  sets,
  activeSetId,
  onSelectSet,
  onUpdateSets,
  cloudStatus = 'unconfigured',
  isCloudConfigured = false,
  onCloudConfigChange
}) {
  const [currentSetId, setCurrentSetId] = useState(activeSetId);
  const [editingQuestion, setEditingQuestion] = useState(null); // null or question object
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);



  const activeSet = sets.find(s => s.id === currentSetId) || sets[0];

  // Helper to update current active set and trigger sync
  const updateCurrentSet = (updatedFields) => {
    let modified = null;
    const updatedSets = sets.map(s => {
      if (s.id === activeSet.id) {
        modified = { ...s, ...updatedFields };
        return modified;
      }
      return s;
    });
    onUpdateSets(updatedSets, modified);
  };

  // Create new set
  const handleCreateNewSet = () => {
    const newId = 'set-' + Date.now();
    const newSet = {
      id: newId,
      title: 'Set Kuis Baru',
      subject: 'Umum',
      grade: 'SD Kelas 4',
      timerSeconds: 10,
      randomizeQuestions: false,
      shuffleChoices: false,
      pointsPerQuestion: 10,
      questions: [
        {
          id: 'q-' + Date.now(),
          text: 'Tulis pertanyaan pertama di sini...',
          choiceA: 'Pilihan Jawaban A',
          choiceB: 'Pilihan Jawaban B',
          correctAnswer: 'A',
          explanation: 'Tulis pembahasan atau penjelasan di sini.'
        }
      ]
    };
    const updatedSets = [newSet, ...sets];
    onUpdateSets(updatedSets, newSet);
    setCurrentSetId(newId);
    onSelectSet(newId);
  };

  // Delete current set
  const handleDeleteSet = (idToDelete) => {
    if (sets.length <= 1) {
      alert("Set kuis terakhir tidak boleh dihapus. Minimal harus ada 1 set.");
      return;
    }
    if (confirm(`Yakin ingin menghapus set soal "${activeSet.title}"?`)) {
      const remaining = sets.filter(s => s.id !== idToDelete);
      onUpdateSets(remaining, null, idToDelete);
      const nextId = remaining[0].id;
      setCurrentSetId(nextId);
      onSelectSet(nextId);
    }
  };

  // Duplicate current set
  const handleDuplicateSet = () => {
    const duplicatedId = 'set-' + Date.now();
    const dupSet = {
      ...JSON.parse(JSON.stringify(activeSet)),
      id: duplicatedId,
      title: `${activeSet.title} (Salinan)`
    };
    const updatedSets = [dupSet, ...sets];
    onUpdateSets(updatedSets, dupSet);
    setCurrentSetId(duplicatedId);
    onSelectSet(duplicatedId);
  };



  // Save / Add Question
  const handleSaveQuestion = (qData) => {
    if (!qData.text.trim() || !qData.choiceA.trim() || !qData.choiceB.trim()) {
      alert("Pertanyaan, Pilihan A, dan Pilihan B wajib diisi!");
      return;
    }

    let updatedQuestions;
    const existingIndex = activeSet.questions.findIndex(q => q.id === qData.id);

    if (existingIndex >= 0) {
      updatedQuestions = [...activeSet.questions];
      updatedQuestions[existingIndex] = qData;
    } else {
      updatedQuestions = [...activeSet.questions, { ...qData, id: 'q-' + Date.now() }];
    }

    updateCurrentSet({ questions: updatedQuestions });
    setEditingQuestion(null);
  };

  // Delete question
  const handleDeleteQuestion = (qId) => {
    if (activeSet.questions.length <= 1) {
      alert("Minimal harus ada 1 soal dalam set.");
      return;
    }
    const updatedQuestions = activeSet.questions.filter(q => q.id !== qId);
    updateCurrentSet({ questions: updatedQuestions });
  };

  // Duplicate question
  const handleDuplicateQuestion = (q) => {
    const dupQ = {
      ...JSON.parse(JSON.stringify(q)),
      id: 'q-' + Date.now(),
      text: `${q.text} (Salinan)`
    };
    updateCurrentSet({ questions: [...activeSet.questions, dupQ] });
  };

  // Move question order
  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeSet.questions.length) return;

    const list = [...activeSet.questions];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    updateCurrentSet({ questions: list });
  };

  // Check key distribution balance (PRD F-09)
  const countA = activeSet.questions.filter(q => q.correctAnswer === 'A').length;
  const countB = activeSet.questions.filter(q => q.correctAnswer === 'B').length;
  const totalQ = activeSet.questions.length;
  const ratioA = totalQ > 0 ? (countA / totalQ) * 100 : 50;
  const isImbalanced = totalQ >= 4 && (ratioA > 70 || ratioA < 30);

  // File import handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsedSets = parseImportedJson(evt.target.result);
        const merged = [...parsedSets, ...sets];
        onUpdateSets(merged);
        setCurrentSetId(parsedSets[0].id);
        onSelectSet(parsedSets[0].id);
        setImportSuccess(`Berhasil mengimpor ${parsedSets.length} set kuis!`);
        setTimeout(() => setImportSuccess(null), 4000);
      } catch (err) {
        setImportError(err.message);
        setTimeout(() => setImportError(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }).catch(() => {
      alert("Gagal menyalin otomatis. Silakan salin manual dari kotak teks.");
    });
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    try {
      const parsedSets = parseImportedJson(pasteText);
      const merged = [...parsedSets, ...sets];
      onUpdateSets(merged);
      setCurrentSetId(parsedSets[0].id);
      onSelectSet(parsedSets[0].id);
      setShowPasteModal(false);
      setPasteText('');
      setImportSuccess(`Berhasil mengimpor ${parsedSets.length} set kuis dari teks ChatGPT!`);
      setTimeout(() => setImportSuccess(null), 4000);
    } catch (err) {
      setImportError(err.message);
      setTimeout(() => setImportError(null), 6000);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar: Question Sets List */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-slate-200">
            <Layers size={18} className="text-sky-400" />
            Set Soal ({sets.length})
          </div>
          <div className="flex items-center gap-1.5">

            <button
              onClick={handleCreateNewSet}
              className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1 transition shadow"
              title="Tambah Set Soal Baru"
            >
              <Plus size={16} /> Buat
            </button>
          </div>
        </div>

        {/* Set list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sets.map(s => {
            const isSelected = s.id === activeSet.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSetId(s.id);
                  onSelectSet(s.id);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500 shadow-md shadow-sky-500/10'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{s.title}</h3>
                  {isSelected && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span className="truncate">{s.subject}</span>
                  <span className="font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.questions.length} Soal
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ChatGPT Actions & Import/Export buttons */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 space-y-2">
          {/* Quick ChatGPT Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-xs text-amber-300 flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles size={14} className="text-amber-400" /> Tempel JSON
            </button>
            <button
              onClick={handleCopyPrompt}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-slate-200 flex items-center justify-center gap-1.5 transition"
              title="Salin template prompt untuk dikirim ke ChatGPT"
            >
              {copiedPrompt ? <CheckCheck size={14} className="text-emerald-400" /> : <Clipboard size={14} />}
              <span>{copiedPrompt ? 'Tersalin!' : 'Salin Prompt'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <label className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition">
              <Upload size={14} /> Berkas JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => exportSetToJson(activeSet)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Download size={14} /> Ekspor JSON
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        {/* Alerts */}
        {importSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-medium text-sm flex items-center gap-2">
            <Check size={18} /> {importSuccess}
          </div>
        )}
        {importError && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 font-medium text-sm flex items-center gap-2">
            <AlertTriangle size={18} /> {importError}
          </div>
        )}

        {/* Cloud Sync Status Banner */}
        <div className={`px-4 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition ${
          cloudStatus === 'connected'
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : cloudStatus === 'syncing'
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
            : cloudStatus === 'offline'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            : 'bg-slate-900/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2.5 font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${
              cloudStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
              cloudStatus === 'syncing' ? 'bg-amber-400 animate-ping' :
              cloudStatus === 'offline' ? 'bg-rose-400' : 'bg-slate-500'
            }`} />
            <span>
              {cloudStatus === 'connected' && 'Database Vercel Terhubung • Setiap soal otomatis tersimpan ke cloud.'}
              {cloudStatus === 'syncing' && 'Menyinkronkan data soal ke Database Vercel...'}
              {cloudStatus === 'offline' && 'Mode Offline. Soal tersimpan di cache lokal browser ini.'}
              {cloudStatus === 'unconfigured' && 'Database Vercel otomatis tersinkronisasi.'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-300">
            <Database size={13} className={cloudStatus === 'connected' ? 'text-emerald-400' : 'text-sky-400'} />
            <span>Database Vercel</span>
          </div>
        </div>

        {/* Set Header & Settings */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Judul Set Soal
              </label>
              <input
                type="text"
                value={activeSet.title}
                onChange={(e) => updateCurrentSet({ title: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 font-bold text-lg text-white focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="w-48">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={activeSet.subject}
                onChange={(e) => updateCurrentSet({ subject: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="w-36">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Kelas / Topik
              </label>
              <input
                type="text"
                value={activeSet.grade}
                onChange={(e) => updateCurrentSet({ grade: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                onClick={handleDuplicateSet}
                title="Gandakan Set Soal Ini"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleDeleteSet(activeSet.id)}
                title="Hapus Set Soal Ini"
                className="p-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Quiz Game Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <Clock className="text-sky-400 shrink-0" size={20} />
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-300 block">Waktu per Soal</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={activeSet.timerSeconds || 10}
                    onChange={(e) => updateCurrentSet({ timerSeconds: parseInt(e.target.value) })}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="text-sm font-bold text-sky-400 min-w-[3rem] text-right">
                    {activeSet.timerSeconds || 10} dtk
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shuffle className="text-amber-400 shrink-0" size={20} />
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-300 block">Acak Urutan Soal</span>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={!!activeSet.randomizeQuestions}
                    onChange={(e) => updateCurrentSet({ randomizeQuestions: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  <span className="ml-2 text-xs text-slate-400">
                    {activeSet.randomizeQuestions ? 'Aktif' : 'Sesuai Urutan'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BookOpen className="text-emerald-400 shrink-0" size={20} />
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-300 block">Tukar Posisi A/B Acak</span>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={!!activeSet.shuffleChoices}
                    onChange={(e) => updateCurrentSet({ shuffleChoices: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs text-slate-400">
                    {activeSet.shuffleChoices ? 'Aktif' : 'Tetap'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Imbalance Warning (PRD F-09) */}
          {isImbalanced && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>
                <strong>Perhatian Kunci Jawaban:</strong> Kunci jawaban set ini berat sebelah 
                ({countA} A vs {countB} B). Sebaiknya seimbangkan variasi kunci agar siswa terlatih menganalisis kedua opsi.
              </span>
            </div>
          )}
        </section>

        {/* Questions Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Daftar Soal ({activeSet.questions.length})
          </h2>
          <button
            onClick={() => setEditingQuestion({
              id: '',
              text: '',
              choiceA: '',
              choiceB: '',
              correctAnswer: 'A',
              explanation: '',
              imageUrl: ''
            })}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-sky-500/25"
          >
            <Plus size={18} /> Tambah Soal
          </button>
        </div>

        {/* Question Cards List */}
        <div className="space-y-3 pb-8">
          {activeSet.questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            >
              {/* Question Number & Content */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 font-black text-slate-300 flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-base text-slate-100">{q.text}</p>
                  
                  {/* Choices A / B badge */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 ${
                      q.correctAnswer === 'A'
                        ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}>
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">A</span>
                      <span>{q.choiceA}</span>
                      {q.correctAnswer === 'A' && <span className="text-emerald-400 ml-1">★ Kunci</span>}
                    </div>

                    <div className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 ${
                      q.correctAnswer === 'B'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">B</span>
                      <span>{q.choiceB}</span>
                      {q.correctAnswer === 'B' && <span className="text-emerald-400 ml-1">★ Kunci</span>}
                    </div>

                    {q.explanation && (
                      <span className="text-slate-400 text-xs italic bg-slate-800/40 px-2.5 py-1 rounded-md">
                        Penjelasan: {q.explanation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Large Touch-Friendly >= 48px) */}
              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => setPreviewQuestion(q)}
                  title="Pratinjau Soal"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => setEditingQuestion(q)}
                  title="Edit Soal"
                  className="px-3.5 h-10 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold text-xs border border-sky-500/30 transition flex items-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicateQuestion(q)}
                  title="Gandakan Soal"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleMoveQuestion(idx, -1)}
                  disabled={idx === 0}
                  title="Geser Naik"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center transition"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleMoveQuestion(idx, 1)}
                  disabled={idx === activeSet.questions.length - 1}
                  title="Geser Turun"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center transition"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  title="Hapus Soal"
                  className="w-10 h-10 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 flex items-center justify-center border border-rose-500/30 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit / Add Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-xl text-white">
                {editingQuestion.id ? 'Edit Soal' : 'Tambah Soal Baru'}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-sm">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Teks Pertanyaan <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="3"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  placeholder="Contoh: Manakah planet yang paling dekat dengan Matahari?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Choice A */}
                <div className="space-y-2 p-4 rounded-2xl bg-sky-950/30 border border-sky-800/50">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-sky-400 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-black">A</span>
                      Pilihan A
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-sky-300">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value="A"
                        checked={editingQuestion.correctAnswer === 'A'}
                        onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: 'A' })}
                        className="accent-sky-500 w-4 h-4"
                      />
                      Kunci Jawaban
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editingQuestion.choiceA}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, choiceA: e.target.value })}
                    placeholder="Contoh: Merkurius"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Choice B */}
                <div className="space-y-2 p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-400 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">B</span>
                      Pilihan B
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-300">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value="B"
                        checked={editingQuestion.correctAnswer === 'B'}
                        onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: 'B' })}
                        className="accent-amber-500 w-4 h-4"
                      />
                      Kunci Jawaban
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editingQuestion.choiceB}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, choiceB: e.target.value })}
                    placeholder="Contoh: Venus"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">
                  Penjelasan Singkat (Opsional, tampil setelah jawaban dibuka)
                </label>
                <textarea
                  rows="2"
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Contoh: Merkurius berjarak sekitar 58 juta km dari matahari..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveQuestion(editingQuestion)}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition"
              >
                Simpan Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Question Modal (PRD F-11) */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl p-8 space-y-8 relative">
            <button
              onClick={() => setPreviewQuestion(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs uppercase tracking-wider">
                Pratinjau Tampilan Layar PID
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white max-w-2xl mx-auto leading-snug">
                {previewQuestion.text}
              </h2>
            </div>

            {/* Split Screen Simulation */}
            <div className="grid grid-cols-2 gap-6 h-64">
              <div className="rounded-2xl bg-sky-950/40 border-4 border-sky-500 flex flex-col items-center justify-center p-6 text-center shadow-xl">
                <span className="text-5xl font-black text-sky-400 mb-2">A</span>
                <span className="text-xl md:text-2xl font-extrabold text-white">
                  {previewQuestion.choiceA}
                </span>
                {previewQuestion.correctAnswer === 'A' && (
                  <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    KUNCI BENAR
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-amber-950/40 border-4 border-amber-500 flex flex-col items-center justify-center p-6 text-center shadow-xl">
                <span className="text-5xl font-black text-amber-400 mb-2">B</span>
                <span className="text-xl md:text-2xl font-extrabold text-white">
                  {previewQuestion.choiceB}
                </span>
                {previewQuestion.correctAnswer === 'B' && (
                  <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    KUNCI BENAR
                  </span>
                )}
              </div>
            </div>

            {previewQuestion.explanation && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-sm">
                <strong className="text-white block mb-1">Penjelasan Guru:</strong>
                {previewQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ChatGPT Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" />
                <h3 className="font-extrabold text-lg text-white">
                  Tempel JSON Soal dari ChatGPT
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Salin teks JSON yang dihasilkan oleh ChatGPT, lalu tempel (paste) ke kotak di bawah. Sistem otomatis mendeteksi dan membersihkan kode markdown.
            </p>

            <textarea
              rows="10"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Contoh:\n{\n  "title": "Kuis Ekosistem",\n  "subject": "IPAS",\n  "grade": "SD Kelas 5",\n  "questions": [\n    {\n      "text": "Hewan pemakan tumbuhan adalah...",\n      "choiceA": "Herbivora",\n      "choiceB": "Karnivora",\n      "correctAnswer": "A",\n      "explanation": "Herbivora memakan daun dan tumbuhan."\n    }\n  ]\n}`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleCopyPrompt}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
              >
                {copiedPrompt ? <CheckCheck size={14} className="text-emerald-400" /> : <Clipboard size={14} />}
                <span>{copiedPrompt ? 'Prompt Disalin!' : 'Salin Template Prompt'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasteImport}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  Impor ke Bank Soal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
