import { AchievementDefinition, ModuleDefinition, RankDefinition, RankId } from '../types/game';

export const MODULES: ModuleDefinition[] = [
  {
    id: 'binary-core',
    code: '01',
    order: 1,
    title: { ru: 'BINARY CORE', kk: 'BINARY CORE' },
    subtitle: { ru: 'Системы счисления', kk: 'Санау жүйелері' },
    description: {
      ru: 'Двоичная, восьмеричная, шестнадцатеричная системы, переводы и двоичная арифметика.',
      kk: 'Екілік, сегіздік, он алтылық жүйелер, түрлендіру және екілік арифметика.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Декодирование повреждённого двоичного блока',
      kk: 'Финал: Бүлінген екілік деректі декодтау',
    },
    accentColor: 'green',
  },
  {
    id: 'data-vault',
    code: '02',
    order: 2,
    title: { ru: 'DATA VAULT', kk: 'DATA VAULT' },
    subtitle: { ru: 'Информация и измерение', kk: 'Ақпарат және өлшеу' },
    description: {
      ru: 'Биты и байты, кодировка текста, объём графики и звука, скорость передачи данных.',
      kk: 'Бит пен байт, мәтінді кодтау, графика мен дыбыс көлемі, дерек беру жылдамдығы.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Восстановление повреждённого цифрового архива',
      kk: 'Финал: Бүлінген цифрлық мұрағатты қалпына келтіру',
    },
    accentColor: 'cyan',
  },
  {
    id: 'logic-engine',
    code: '03',
    order: 3,
    title: { ru: 'LOGIC ENGINE', kk: 'LOGIC ENGINE' },
    subtitle: { ru: 'Логика и алгоритмы', kk: 'Логика және алгоритмдер' },
    description: {
      ru: 'Операции И/ИЛИ/НЕ, таблицы истинности, блок-схемы, ветвления и циклы.',
      kk: 'ЖӘНЕ/НЕМЕСЕ/ЕМЕС операциялары, ақиқат кестелері, блок-схемалар, тармақталу және циклдер.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Починка повреждённого алгоритма',
      kk: 'Финал: Бүлінген алгоритмді жөндеу',
    },
    accentColor: 'green',
  },
  {
    id: 'python-lab',
    code: '04',
    order: 4,
    title: { ru: 'PYTHON LAB', kk: 'PYTHON LAB' },
    subtitle: { ru: 'Программирование на Python', kk: 'Python бағдарламалау' },
    description: {
      ru: 'Переменные, условия, циклы for/while, строки, списки и поиск ошибок в коде.',
      kk: 'Айнымалылар, шарттар, for/while циклдері, жолдар, тізімдер және код қателерін түзету.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Исправление сбойного модуля Python',
      kk: 'Финал: Істен шыққан Python бағдарламасын түзету',
    },
    accentColor: 'cyan',
  },
  {
    id: 'data-matrix',
    code: '05',
    order: 5,
    title: { ru: 'DATA MATRIX', kk: 'DATA MATRIX' },
    subtitle: { ru: 'Базы данных и SQL', kk: 'Деректер қоры және SQL' },
    description: {
      ru: 'Ключи, связи таблиц, запросы SELECT, WHERE, GROUP BY, агрегаты и JOIN.',
      kk: 'Кілттер, кесте байланыстары, SELECT, WHERE, GROUP BY, агрегаттар және JOIN.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Извлечение критических данных через SQL',
      kk: 'Финал: SQL арқылы маңызды деректерді алу',
    },
    accentColor: 'green',
  },
  {
    id: 'network-protocol',
    code: '06',
    order: 6,
    title: { ru: 'NETWORK PROTOCOL', kk: 'NETWORK PROTOCOL' },
    subtitle: { ru: 'Сети и технологии', kk: 'Желілер және технологиялар' },
    description: {
      ru: 'IP-адреса, DNS, протоколы HTTP/HTTPS/FTP, архитектура ПК, ОС и кибербезопасность.',
      kk: 'IP-мекенжайлар, DNS, HTTP/HTTPS/FTP хаттамалары, ДК архитектурасы, ОЖ және қауіпсіздік.',
    },
    finalChallengeTitle: {
      ru: 'Финал: Восстановление сетевого контура системы',
      kk: 'Финал: Жүйенің желілік контурын қалпына келтіру',
    },
    accentColor: 'cyan',
  },
];

export const RANKS: RankDefinition[] = [
  {
    id: 'rookie',
    minXp: 0,
    level: 1,
    title: { ru: 'ROOKIE · Новичок', kk: 'ROOKIE · Жаңа оператор' },
  },
  {
    id: 'analyst',
    minXp: 350,
    level: 2,
    title: { ru: 'ANALYST · Аналитик', kk: 'ANALYST · Талдаушы' },
  },
  {
    id: 'developer',
    minXp: 900,
    level: 3,
    title: { ru: 'DEVELOPER · Разработчик', kk: 'DEVELOPER · Әзірлеуші' },
  },
  {
    id: 'architect',
    minXp: 1650,
    level: 4,
    title: { ru: 'ARCHITECT · Архитектор', kk: 'ARCHITECT · Сәулетші' },
  },
  {
    id: 'system_master',
    minXp: 2600,
    level: 5,
    title: { ru: 'SYSTEM MASTER · Мастер системы', kk: 'SYSTEM MASTER · Жүйе шебері' },
  },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_boot',
    title: { ru: 'FIRST BOOT · Первый запуск', kk: 'FIRST BOOT · Алғашқы іске қосу' },
    description: {
      ru: 'Завершите инициализацию системы и войдите в панель оператора.',
      kk: 'Жүйені іске қосуды аяқтап, оператор панеліне кіріңіз.',
    },
    xpBonus: 50,
  },
  {
    id: 'binary_master',
    title: { ru: 'BINARY MASTER · Мастер кода', kk: 'BINARY MASTER · Екілік код шебері' },
    description: {
      ru: 'Полностью восстановите модуль 01 — BINARY CORE.',
      kk: '01 — BINARY CORE модулін толық қалпына келтіріңіз.',
    },
    xpBonus: 120,
  },
  {
    id: 'debugger',
    title: { ru: 'DEBUGGER · Отладчик', kk: 'DEBUGGER · Код жөндеуші' },
    description: {
      ru: 'Успешно решите 10 заданий по отладке и программированию Python.',
      kk: 'Python кодын жөндеу және бағдарламалау бойынша 10 тапсырманы сәтті шешіңіз.',
    },
    xpBonus: 150,
  },
  {
    id: 'sql_architect',
    title: { ru: 'SQL ARCHITECT · Архитектор БД', kk: 'SQL ARCHITECT · ДҚ сәулетшісі' },
    description: {
      ru: 'Полностью восстановите модуль 05 — DATA MATRIX.',
      kk: '05 — DATA MATRIX модулін толық қалпына келтіріңіз.',
    },
    xpBonus: 150,
  },
  {
    id: 'perfect_run',
    title: { ru: 'PERFECT RUN · Без ошибок', kk: 'PERFECT RUN · Қатесіз өту' },
    description: {
      ru: 'Завершите миссию модуля без единой ошибки.',
      kk: 'Модуль миссиясын бірде-бір қатесіз аяқтаңыз.',
    },
    xpBonus: 180,
  },
  {
    id: 'system_restored',
    title: { ru: 'SYSTEM RESTORED · Система в строю', kk: 'SYSTEM RESTORED · Жүйе қалпына келді' },
    description: {
      ru: 'Восстановите все шесть основных модулей EXAM.exe.',
      kk: 'EXAM.exe жүйесінің барлық алты негізгі модулін қалпына келтіріңіз.',
    },
    xpBonus: 300,
  },
  {
    id: 'final_operator',
    title: { ru: 'FINAL OPERATOR · Главный оператор', kk: 'FINAL OPERATOR · Қорытынды оператор' },
    description: {
      ru: 'Пройдите финальную симуляцию ЕНТ с результатом от 80%.',
      kk: 'ҰБТ қорытынды симуляциясынан 80% немесе одан жоғары нәтижемен өтіңіз.',
    },
    xpBonus: 400,
  },
];

export function getRankForXp(xp: number): RankDefinition {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) {
      current = r;
    }
  }
  return current;
}

export function getNextRank(rankId: RankId): RankDefinition | null {
  const idx = RANKS.findIndex((r) => r.id === rankId);
  if (idx === -1 || idx === RANKS.length - 1) return null;
  return RANKS[idx + 1];
}
