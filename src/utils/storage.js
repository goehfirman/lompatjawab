import { DEFAULT_QUESTION_SETS } from './defaultQuestions';

const STORAGE_KEY = 'lompat_pilih_question_sets_v1';
const ACTIVE_SET_KEY = 'lompat_pilih_active_set_id_v1';
const SETTINGS_KEY = 'lompat_pilih_game_settings_v1';

export function loadQuestionSets() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse question sets from localStorage', e);
  }
  // Initialize with default question sets
  saveQuestionSets(DEFAULT_QUESTION_SETS);
  return DEFAULT_QUESTION_SETS;
}

export function saveQuestionSets(sets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (e) {
    console.error('Failed to save question sets to localStorage', e);
  }
}

export function getActiveSetId() {
  return localStorage.getItem(ACTIVE_SET_KEY) || 'ipas-sd-4';
}

export function setActiveSetId(id) {
  localStorage.setItem(ACTIVE_SET_KEY, id);
}

export function loadGameSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return {
    initialStudentsCount: 20,
    survivorTarget: 1,
    gameMode: 'free', // 'free' | 'elimination'
    playerCount: 2,
    playerNames: ['Pemain 1', 'Pemain 2', 'Pemain 3', 'Pemain 4'],
    timerOverride: null, // null means use set default
    motionMode: 'jump', // 'jump' | 'step' | 'stand'
    soundEnabled: true,
    simulationMode: false,
    pointsPerQuestion: 10
  };
}

export function saveGameSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportSetToJson(set) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(set, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const cleanName = (set.title || 'soal').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadAnchor.setAttribute("download", `lompat_pilih_${cleanName}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseImportedJson(jsonString) {
  try {
    let cleanStr = jsonString.trim();

    // 1. Strip markdown code fences if present (```json ... ``` or ``` ...)
    if (cleanStr.includes('```')) {
      cleanStr = cleanStr.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    }

    // 2. If there is conversational text before/after, find the first { or [ and last } or ]
    const firstBrace = cleanStr.indexOf('{');
    const firstBracket = cleanStr.indexOf('[');
    let startIdx = 0;
    let endIdx = cleanStr.length;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleanStr.lastIndexOf('}') + 1;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleanStr.lastIndexOf(']') + 1;
    }

    if (startIdx >= 0 && endIdx > startIdx) {
      cleanStr = cleanStr.substring(startIdx, endIdx);
    }

    const parsed = JSON.parse(cleanStr);

    // 3. Helper to normalize individual question objects
    const normalizeQuestion = (q, idx) => {
      const text = q.text || q.pertanyaan || q.soal || q.question || '';
      const choiceA = q.choiceA || q.pilihanA || q.opsiA || q.opsi_a || q.a || q.A || '';
      const choiceB = q.choiceB || q.pilihanB || q.opsiB || q.opsi_b || q.b || q.B || '';
      let correct = String(q.correctAnswer || q.kunci || q.jawaban || q.kunciJawaban || q.kunci_jawaban || 'A').toUpperCase().trim();
      if (!['A', 'B'].includes(correct)) {
        // If correct answer matches text of choiceB, set B; else A
        if (String(q.kunci || q.jawaban).trim().toLowerCase() === String(choiceB).trim().toLowerCase()) {
          correct = 'B';
        } else {
          correct = 'A';
        }
      }
      const explanation = q.explanation || q.penjelasan || q.pembahasan || '';

      return {
        id: q.id || `q-${Date.now()}-${idx}`,
        text: String(text).trim(),
        choiceA: String(choiceA).trim(),
        choiceB: String(choiceB).trim(),
        correctAnswer: correct,
        explanation: String(explanation).trim()
      };
    };

    // 4. Handle if user directly pastes an array of questions without set metadata
    let setsToProcess = [];
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && (parsed[0].text || parsed[0].pertanyaan || parsed[0].soal || parsed[0].choiceA || parsed[0].pilihanA)) {
        // Array of questions directly! Wrap into a new set
        setsToProcess = [{
          title: 'Set Soal Hasil AI',
          subject: 'Umum',
          grade: 'SD',
          questions: parsed
        }];
      } else {
        setsToProcess = parsed;
      }
    } else {
      setsToProcess = [parsed];
    }

    // 5. Build validated sets
    const validatedSets = setsToProcess.map(s => {
      const rawQuestions = Array.isArray(s.questions) ? s.questions : Array.isArray(s.soal) ? s.soal : Array.isArray(s.daftar_soal) ? s.daftar_soal : [];
      const normalizedQuestions = rawQuestions.map(normalizeQuestion).filter(q => q.text && q.choiceA && q.choiceB);

      return {
        id: s.id || 'imported-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: s.title || s.judul || 'Set Soal Hasil Import',
        subject: s.subject || s.mata_pelajaran || s.mapel || 'Umum',
        grade: s.grade || s.kelas || s.jenjang || 'SD',
        timerSeconds: parseInt(s.timerSeconds || s.durasi_detik || s.waktu || 10),
        randomizeQuestions: !!(s.randomizeQuestions || s.acak_soal),
        shuffleChoices: !!(s.shuffleChoices || s.acak_pilihan),
        questions: normalizedQuestions
      };
    }).filter(s => s.questions.length > 0);

    if (validatedSets.length === 0) {
      throw new Error("Tidak ditemukan daftar soal yang valid (setiap soal harus memiliki pertanyaan, pilihan A, dan pilihan B).");
    }

    return validatedSets;
  } catch (err) {
    throw new Error("Gagal membaca format JSON: " + err.message);
  }
}

/**
 * Merge local question sets with cloud question sets
 */
export function mergeLocalAndCloudSets(localSets, cloudSets) {
  if (!Array.isArray(cloudSets) || cloudSets.length === 0) {
    return localSets;
  }

  const cloudMap = new Map();
  cloudSets.forEach(s => {
    if (s && s.id) cloudMap.set(s.id, s);
  });

  const merged = [];
  const processedIds = new Set();

  // 1. Cloud sets take priority
  cloudSets.forEach(cs => {
    merged.push(cs);
    processedIds.add(cs.id);
  });

  // 2. Keep local sets that are not in cloud yet
  (localSets || []).forEach(ls => {
    if (ls && ls.id && !processedIds.has(ls.id)) {
      merged.push(ls);
      processedIds.add(ls.id);
    }
  });

  return merged;
}
