import { Question } from '../types/game';
import { MODULES_01_03_QUESTIONS } from './modules01_03';
import { MODULES_04_06_QUESTIONS } from './modules04_06';

// 12 additional verified UNT-style questions (making 60 total verified questions)
// Including extra Python debugging questions so 10+ unique debug challenges exist!
export const EXTRA_BOSS_POOL: Question[] = [
  {
    id: 'boss-q1',
    moduleId: 'binary-core',
    order: 9,
    format: 'QUICK_TEST',
    difficulty: 'intermediate',
    topicTag: { ru: 'Единицы в двоичной записи', kk: 'Екілік жазбадағы бірліктер' },
    xpReward: 60,
    title: { ru: 'Подсчёт единиц', kk: 'Бірліктерді санау' },
    prompt: {
      ru: 'Сколько единиц содержится в двоичной записи десятичного числа 137?',
      kk: '137 ондық санының екілік жазбасында неше бірлік бар?',
    },
    options: { ru: ['2', '3', '4', '5'], kk: ['2', '3', '4', '5'] },
    correctIndex: 1,
    hint: {
      ru: '137 = 128 + 8 + 1 = 2⁷ + 2³ + 2⁰.',
      kk: '137 = 128 + 8 + 1 = 2⁷ + 2³ + 2⁰.',
    },
    solutionDisplay: { ru: '3', kk: '3' },
    explanation: {
      ru: '137₁₀ = 10001001₂. В записи ровно 3 единицы.',
      kk: '137₁₀ = 10001001₂. Жазбада дәл 3 бірлік бар.',
    },
  },
  {
    id: 'boss-q2',
    moduleId: 'binary-core',
    order: 10,
    format: 'QUICK_TEST',
    difficulty: 'advanced',
    topicTag: { ru: 'Сравнение систем счисления', kk: 'Санау жүйелерін салыстыру' },
    xpReward: 65,
    title: { ru: 'Сравнение кодов', kk: 'Кодтарды салыстыру' },
    prompt: {
      ru: 'Какое из следующих чисел является наибольшим: 101100₂, 56₈, 2D₁₆, 45₁₀?',
      kk: 'Мына сандардың қайсысы ең үлкен: 101100₂, 56₈, 2D₁₆, 45₁₀?',
    },
    options: {
      ru: ['101100₂', '56₈', '2D₁₆', '45₁₀'],
      kk: ['101100₂', '56₈', '2D₁₆', '45₁₀'],
    },
    correctIndex: 1,
    hint: {
      ru: 'Переведите все числа в десятичную систему: 44, 46, 45, 45.',
      kk: 'Барлық сандарды ондық жүйеге ауыстырыңыз: 44, 46, 45, 45.',
    },
    solutionDisplay: { ru: '56₈ (46₁₀)', kk: '56₈ (46₁₀)' },
    explanation: {
      ru: '101100₂ = 44; 56₈ = 5·8 + 6 = 46; 2D₁₆ = 32 + 13 = 45; 45₁₀ = 45. Максимум — 56₈.',
      kk: '101100₂ = 44; 56₈ = 46; 2D₁₆ = 45; 45₁₀ = 45. Ең үлкені — 56₈.',
    },
  },
  {
    id: 'boss-q3',
    moduleId: 'data-vault',
    order: 9,
    format: 'QUICK_TEST',
    difficulty: 'intermediate',
    topicTag: { ru: 'Глубина цвета', kk: 'Түс тереңдігі' },
    xpReward: 60,
    title: { ru: 'Глубина палитры', kk: 'Палитра тереңдігі' },
    prompt: {
      ru: 'Для хранения растрового изображения размером 128 × 128 пикселей выделено 8 Кбайт памяти. Каково максимально возможное количество цветов в палитре?',
      kk: '128 × 128 пиксель өлшемді растрлық кескінді сақтауға 8 Кбайт жад бөлінген. Палитрадағы түстердің ең көп мүмкін саны қанша?',
    },
    options: { ru: ['4', '8', '16', '32'], kk: ['4', '8', '16', '32'] },
    correctIndex: 2,
    hint: {
      ru: '8 Кбайт = 8 · 1024 · 8 бит = 65 536 бит. Разделите на 128 · 128 = 16 384 пикселя.',
      kk: '8 Кбайт = 65 536 бит. 128 · 128 = 16 384 пиксельге бөліңіз.',
    },
    solutionDisplay: { ru: '16 цветов', kk: '16 түс' },
    explanation: {
      ru: 'i = 65 536 / 16 384 = 4 бита на пиксель. Число цветов N = 2⁴ = 16.',
      kk: 'i = 65 536 / 16 384 = 4 бит/пиксель. Түстер саны N = 2⁴ = 16.',
    },
  },
  {
    id: 'boss-q4',
    moduleId: 'data-vault',
    order: 10,
    format: 'QUICK_TEST',
    difficulty: 'beginner',
    topicTag: { ru: 'Единицы информации', kk: 'Ақпарат өлшемдері' },
    xpReward: 50,
    title: { ru: 'Объём пароля', kk: 'Құпиясөз көлемі' },
    prompt: {
      ru: 'Пароль состоит из 12 символов. Каждый символ кодируется минимально возможным целым числом бит с использованием 32-символьного алфавита. Сколько бит занимает весь пароль?',
      kk: 'Құпиясөз 12 символдан тұрады. Әр символ 32 символдық әліпбиден минималды бүтін бит санымен кодталады. Бүкіл құпиясөз неше бит орын алады?',
    },
    options: { ru: ['48 бит', '60 бит', '72 бита', '96 бит'], kk: ['48 бит', '60 бит', '72 бит', '96 бит'] },
    correctIndex: 1,
    hint: {
      ru: '32 = 2⁵ ⇒ 5 бит на 1 символ. 12 × 5 = 60.',
      kk: '32 = 2⁵ ⇒ 1 символға 5 бит. 12 × 5 = 60.',
    },
    solutionDisplay: { ru: '60 бит', kk: '60 бит' },
    explanation: {
      ru: 'Вес 1 символа = 5 бит (2⁵ = 32). Объём 12 символов = 12 · 5 = 60 бит.',
      kk: '1 символ салмағы = 5 бит (2⁵ = 32). 12 символ көлемі = 12 · 5 = 60 бит.',
    },
  },
  {
    id: 'boss-q5',
    moduleId: 'logic-engine',
    order: 9,
    format: 'QUICK_TEST',
    difficulty: 'intermediate',
    topicTag: { ru: 'Таблицы истинности', kk: 'Ақиқат кестелері' },
    xpReward: 60,
    title: { ru: 'Количество строк таблицы', kk: 'Кесте жолдарының саны' },
    prompt: {
      ru: 'Сколько строк (не считая заголовка) содержит полная таблица истинности для логического выражения от 4 независимых переменных A, B, C, D?',
      kk: 'A, B, C, D 4 тәуелсіз айнымалыдан тұратын логикалық өрнектің толық ақиқат кестесінде (тақырыпты санамағанда) неше жол болады?',
    },
    options: { ru: ['8', '12', '16', '32'], kk: ['8', '12', '16', '32'] },
    correctIndex: 2,
    hint: {
      ru: 'Число комбинаций для n переменных равно 2ⁿ.',
      kk: 'n айнымалы үшін комбинациялар саны 2ⁿ-ге тең.',
    },
    solutionDisplay: { ru: '16', kk: '16' },
    explanation: {
      ru: 'Для 4 переменных количество наборов равно 2⁴ = 16.',
      kk: '4 айнымалы үшін жиынтықтар саны 2⁴ = 16.',
    },
  },
  {
    id: 'boss-q6',
    moduleId: 'logic-engine',
    order: 10,
    format: 'QUICK_TEST',
    difficulty: 'advanced',
    topicTag: { ru: 'Трассировка алгоритма', kk: 'Алгоритм трассировкасы' },
    xpReward: 65,
    title: { ru: 'Ветвление и остаток', kk: 'Тармақталу және қалдық' },
    prompt: {
      ru: 'Начальное значение a = 14, b = 4. Выполняется: если a > b * 3, то a = a - b, иначе a = a + b. Чему равно a после выполнения?',
      kk: 'Бастапқы мәндер: a = 14, b = 4. Орындалады: егер a > b * 3 болса, a = a - b, әйтпесе a = a + b. Орындалғаннан кейін a нешеге тең?',
    },
    options: { ru: ['10', '14', '18', '12'], kk: ['10', '14', '18', '12'] },
    correctIndex: 0,
    hint: {
      ru: 'Проверьте 14 > 4 * 3 (то есть 14 > 12). Условие истинно.',
      kk: '14 > 4 * 3 (яғни 14 > 12) шартын тексеріңіз. Шарт ақиқат.',
    },
    solutionDisplay: { ru: '10', kk: '10' },
    explanation: {
      ru: 'b * 3 = 12. Поскольку 14 > 12 истинно, выполняется ветвь «то»: a = 14 - 4 = 10.',
      kk: 'b * 3 = 12. 14 > 12 ақиқат болғандықтан, a = 14 - 4 = 10 орындалады.',
    },
  },
  {
    id: 'boss-q7',
    moduleId: 'python-lab',
    order: 9,
    format: 'DEBUG_MODE',
    difficulty: 'intermediate',
    topicTag: { ru: 'Отладка функций Python', kk: 'Python функциясын жөндеу' },
    xpReward: 65,
    title: { ru: 'Генератор квадратов', kk: 'Квадраттар генераторы' },
    prompt: {
      ru: 'Определите, что выведет следующий код Python.',
      kk: 'Келесі Python коды не шығаратынын анықтаңыз.',
    },
    python: {
      mode: 'predict_output',
      codeLines: [
        'res = [x * x for x in range(1, 5) if x % 2 == 0]',
        'print(res)',
      ],
      options: {
        ru: ['[1, 4, 9, 16]', '[4, 16]', '[2, 4]', '[4, 16, 25]'],
        kk: ['[1, 4, 9, 16]', '[4, 16]', '[2, 4]', '[4, 16, 25]'],
      },
      correctOptionIndex: 1,
      expectedConsoleOutput: '[4, 16]',
    },
    hint: {
      ru: 'range(1, 5) даёт 1, 2, 3, 4. Чётные из них — 2 и 4.',
      kk: 'range(1, 5) 1, 2, 3, 4 сандарын береді. Олардың жұптары — 2 мен 4.',
    },
    solutionDisplay: { ru: '[4, 16]', kk: '[4, 16]' },
    explanation: {
      ru: 'Фильтр if x % 2 == 0 оставляет 2 и 4; их квадраты равны 4 и 16 ⇒ [4, 16].',
      kk: 'if x % 2 == 0 сүзгісі 2 және 4 сандарын қалдырады; квадраттары 4 пен 16 ⇒ [4, 16].',
    },
  },
  {
    id: 'boss-q8',
    moduleId: 'python-lab',
    order: 10,
    format: 'DEBUG_MODE',
    difficulty: 'advanced',
    topicTag: { ru: 'Рекурсия и отладка', kk: 'Рекурсия және жөндеу' },
    xpReward: 75,
    title: { ru: 'Рекурсивный вызов', kk: 'Рекурсивті шақыру' },
    prompt: {
      ru: 'Что выведет рекурсивная функция f(4)?',
      kk: 'f(4) рекурсивті функциясы не шығарады?',
    },
    python: {
      mode: 'predict_output',
      codeLines: [
        'def f(n):',
        '    if n <= 1:',
        '        return 1',
        '    return n + f(n - 1)',
        'print(f(4))',
      ],
      options: {
        ru: ['6', '10', '15', '24'],
        kk: ['6', '10', '15', '24'],
      },
      correctOptionIndex: 1,
      expectedConsoleOutput: '10',
    },
    hint: {
      ru: 'f(4) = 4 + f(3) = 4 + 3 + f(2) = 4 + 3 + 2 + f(1).',
      kk: 'f(4) = 4 + f(3) = 4 + 3 + f(2) = 4 + 3 + 2 + f(1).',
    },
    solutionDisplay: { ru: '10', kk: '10' },
    explanation: {
      ru: '4 + 3 + 2 + 1 = 10.',
      kk: '4 + 3 + 2 + 1 = 10.',
    },
  },
  {
    id: 'boss-q9',
    moduleId: 'data-matrix',
    order: 9,
    format: 'QUICK_TEST',
    difficulty: 'intermediate',
    topicTag: { ru: 'SQL-фильтрация', kk: 'SQL сүзу' },
    xpReward: 60,
    title: { ru: 'Фильтр групп HAVING vs WHERE', kk: 'HAVING пен WHERE айырмашылығы' },
    prompt: {
      ru: 'Какое ключевое слово SQL используется для фильтрации уже сгруппированных агрегированных данных после GROUP BY?',
      kk: 'GROUP BY орындалғаннан кейін топталған агрегаттық деректерді сүзу үшін қандай SQL кілт сөзі қолданылады?',
    },
    options: {
      ru: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
      kk: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
    },
    correctIndex: 1,
    hint: {
      ru: 'WHERE работает со строками до группировки, а для условий на COUNT/SUM/AVG после GROUP BY нужно другое слово.',
      kk: 'WHERE топтауға дейінгі жолдармен жұмыс істейді, ал GROUP BY-дан кейін агрегаттарды сүзуге басқа оператор керек.',
    },
    solutionDisplay: { ru: 'HAVING', kk: 'HAVING' },
    explanation: {
      ru: 'HAVING применяет условие к группам, созданным предложением GROUP BY.',
      kk: 'HAVING шарты GROUP BY арқылы құрылған топтарға қолданылады.',
    },
  },
  {
    id: 'boss-q10',
    moduleId: 'data-matrix',
    order: 10,
    format: 'QUICK_TEST',
    difficulty: 'beginner',
    topicTag: { ru: 'Типы связей БД', kk: 'ДҚ байланыс түрлері' },
    xpReward: 55,
    title: { ru: 'Связь «один ко многим»', kk: '«Бірден көпке» байланысы' },
    prompt: {
      ru: 'В базе данных один автор может написать несколько книг, а каждая книга принадлежит одному автору. Какой тип связи между таблицами Authors и Books?',
      kk: 'Деректер қорында бір автор бірнеше кітап жаза алады, ал әр кітап бір авторға тиесілі. Authors және Books кестелері арасында қандай байланыс түрі бар?',
    },
    options: {
      ru: ['Один к одному (1:1)', 'Один ко многим (1:N)', 'Многие ко многим (M:N)', 'Без связи'],
      kk: ['Бірден бірге (1:1)', 'Бірден көпке (1:N)', 'Көптен көпке (M:N)', 'Байланыссыз'],
    },
    correctIndex: 1,
    hint: {
      ru: '1 автор → N книг.',
      kk: '1 автор → N кітап.',
    },
    solutionDisplay: { ru: 'Один ко многим (1:N)', kk: 'Бірден көпке (1:N)' },
    explanation: {
      ru: 'Одной записи в Authors соответствует множество записей в Books — это связь 1:N.',
      kk: 'Authors кестесіндегі бір жазбаға Books кестесіндегі көп жазба сәйкес келеді — бұл 1:N байланысы.',
    },
  },
  {
    id: 'boss-q11',
    moduleId: 'network-protocol',
    order: 9,
    format: 'QUICK_TEST',
    difficulty: 'intermediate',
    topicTag: { ru: 'Порты и протоколы', kk: 'Порттар және хаттамалар' },
    xpReward: 60,
    title: { ru: 'Защищённый веб-трафик', kk: 'Қорғалған веб-трафик' },
    prompt: {
      ru: 'Какой стандартный TCP-порт использует протокол HTTPS по умолчанию?',
      kk: 'HTTPS хаттамасы әдепкі бойынша қандай стандартты TCP-портты қолданады?',
    },
    options: { ru: ['21', '80', '443', '53'], kk: ['21', '80', '443', '53'] },
    correctIndex: 2,
    hint: {
      ru: 'HTTP использует порт 80, а защищённый HTTPS — порт 443.',
      kk: 'HTTP 80-портты, ал қорғалған HTTPS 443-портты пайдаланады.',
    },
    solutionDisplay: { ru: '443', kk: '443' },
    explanation: {
      ru: '21 — FTP, 53 — DNS, 80 — HTTP, 443 — HTTPS.',
      kk: '21 — FTP, 53 — DNS, 80 — HTTP, 443 — HTTPS.',
    },
  },
  {
    id: 'boss-q12',
    moduleId: 'network-protocol',
    order: 10,
    format: 'QUICK_TEST',
    difficulty: 'beginner',
    topicTag: { ru: 'Устройства компьютера', kk: 'Компьютер құрылғылары' },
    xpReward: 50,
    title: { ru: 'Сверхбыстрая кэш-память', kk: 'Жылдам кэш-жад' },
    prompt: {
      ru: 'Какой тип памяти встроен непосредственно в центральный процессор (CPU) для ускорения доступа к часто используемым данным?',
      kk: 'Жиі қолданылатын деректерге қол жеткізуді жылдамдату үшін орталық процессордың (CPU) ішіне орнатылған жад түрі қалай аталады?',
    },
    options: {
      ru: ['Кэш-память (Cache)', 'Оптический диск', 'Стример', 'Жесткий диск (HDD)'],
      kk: ['Кэш-жад (Cache)', 'Оптикалық диск', 'Стример', 'Қатты диск (HDD)'],
    },
    correctIndex: 0,
    hint: {
      ru: 'Именно уровни L1, L2, L3 этой памяти измеряются в мегабайтах внутри CPU.',
      kk: 'Оның L1, L2, L3 деңгейлері процессор ішінде орналасқан.',
    },
    solutionDisplay: { ru: 'Кэш-память (Cache)', kk: 'Кэш-жад (Cache)' },
    explanation: {
      ru: 'Кэш-память (L1/L2/L3) — сверхбыстрая память внутри процессора, снижающая задержку обращения к ОЗУ.',
      kk: 'Кэш-жад (L1/L2/L3) — процессор ішіндегі өте жылдам жад, ол жедел жадқа жүгіну кідірісін азайтады.',
    },
  },
];

export const ALL_QUESTIONS: Question[] = [
  ...MODULES_01_03_QUESTIONS,
  ...MODULES_04_06_QUESTIONS,
  ...EXTRA_BOSS_POOL,
];

export function getModuleQuestions(moduleId: Question['moduleId']): Question[] {
  return ALL_QUESTIONS.filter(
    (q) => q.moduleId === moduleId && !q.id.startsWith('boss-')
  ).sort((a, b) => a.order - b.order);
}

export function getPythonLabQuestions(): Question[] {
  return ALL_QUESTIONS.filter((q) => q.format === 'DEBUG_MODE' && q.python);
}

export function getSqlTerminalQuestions(): Question[] {
  return ALL_QUESTIONS.filter((q) => q.format === 'SQL_TERMINAL' && q.sql);
}

/**
 * Generates a balanced 20-question UNT Final Boss exam across all 6 modules,
 * using non-SQL/non-Python-editor interactive formats or selectable variants cleanly
 * (all 60 questions work in Gameplay/Boss, and Boss renders every format seamlessly!).
 */
export function buildFinalBossDeck(): Question[] {
  const modules = [
    'binary-core',
    'data-vault',
    'logic-engine',
    'python-lab',
    'data-matrix',
    'network-protocol',
  ] as const;

  const chosen: Question[] = [];
  const usedIds = new Set<string>();

  // Pick 3 random questions per module = 18
  for (const mod of modules) {
    const pool = ALL_QUESTIONS.filter((q) => q.moduleId === mod);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const q of shuffled.slice(0, 3)) {
      chosen.push(q);
      usedIds.add(q.id);
    }
  }

  // Pick 2 more random questions from remaining pool = 20 total
  const remaining = ALL_QUESTIONS.filter((q) => !usedIds.has(q.id)).sort(
    () => Math.random() - 0.5
  );
  for (const q of remaining.slice(0, 2)) {
    chosen.push(q);
  }

  // Shuffle final deck order
  return chosen.sort(() => Math.random() - 0.5);
}
