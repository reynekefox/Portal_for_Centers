// Training-specific parameters and success criteria configuration
// Shared across school-dashboard and student-dashboard

export interface TrainingParam {
    key: string;
    label: string;
    type: 'number' | 'select' | 'toggle';
    default: number | string | boolean;
    options?: { value: string | number; label: string }[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}

export interface TrainingConfig {
    params: TrainingParam[];
    successCriteria: {
        type: 'time_only' | 'max_time' | 'min_accuracy' | 'min_score' | 'completion' | 'min_moves';
        label: string;
        unit?: string;
        default?: number;
        min?: number;
        max?: number;
        step?: number;
    };
}

export const TRAINING_CONFIG: Record<string, TrainingConfig> = {
    'stroop-test': {
        params: [
            { key: 'duration', label: 'Продолжительность', type: 'number', default: 60, min: 30, max: 600, step: 30, unit: 'сек' },
            { key: 'speed', label: 'Скорость смены слов', type: 'number', default: 0.5, min: 0.1, max: 5, step: 0.1, unit: 'сек' },
            { key: 'fontSize', label: 'Размер шрифта', type: 'number', default: 3, min: 1, max: 10, step: 0.5 },
            { key: 'showClaps', label: 'Хлопки', type: 'toggle', default: false },
            { key: 'showDistractors', label: 'Помехи', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'time_only', label: 'Пройти указанное время' }
    },
    'schulte-table': {
        params: [
            {
                key: 'gridSize', label: 'Размер таблицы', type: 'select', default: 5, options: [
                    { value: 3, label: '3×3' }, { value: 4, label: '4×4' }, { value: 5, label: '5×5' }, { value: 6, label: '6×6' }, { value: 7, label: '7×7' }
                ]
            },
            { key: 'step', label: 'Шаг', type: 'number', default: 1, min: 1, max: 5, step: 1 },
            { key: 'isGorbov', label: 'Шульте-Горбов', type: 'toggle', default: false },
            { key: 'useLeadingZeros', label: '01..', type: 'toggle', default: false },
            { key: 'useTempHighlight', label: 'Исчезание', type: 'toggle', default: false },
            { key: 'useShuffle', label: 'Микс', type: 'toggle', default: false },
            { key: 'showHint', label: 'Скрыть подсказку', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'max_time', label: 'Макс. время', unit: 'сек', default: 60, min: 10, max: 300 }
    },
    'n-back': {
        params: [
            { key: 'duration', label: 'Время', type: 'number', default: 120, min: 30, max: 600, step: 30, unit: 'сек' },
            { key: 'n', label: 'Уровень N', type: 'number', default: 2, min: 1, max: 5, step: 1 },
            {
                key: 'mode', label: 'Режим', type: 'select', default: 'letters', options: [
                    { value: 'letters', label: 'Буквы' }, { value: 'shapes', label: 'Фигуры' }
                ]
            },
            { key: 'intervalMs', label: 'Скорость', type: 'number', default: 2000, min: 500, max: 5000, step: 500, unit: 'мс' }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 70, min: 50, max: 100 }
    },
    'correction-test': {
        params: [
            { key: 'signCount', label: 'Количество знаков', type: 'number', default: 200, min: 10, max: 500, step: 10 },
            {
                key: 'mode', label: 'Режим', type: 'select', default: 'letters', options: [
                    { value: 'letters', label: 'Буквы' }, { value: 'numbers', label: 'Цифры' }, { value: 'rings', label: 'Кольца' }
                ]
            },
            { key: 'timeLimit', label: 'Время на выполнение', type: 'number', default: 60, min: 30, max: 300, step: 30, unit: 'сек' }
        ],
        successCriteria: { type: 'completion', label: 'Найти все цели' }
    },
    'counting-game': {
        params: [
            {
                key: 'mode', label: 'Числа', type: 'select', default: 'single', options: [
                    { value: 'single', label: '1-10' }, { value: 'series', label: '1-50' }
                ]
            },
            {
                key: 'gridConfig', label: 'Размер поля', type: 'select', default: '3x3', options: [
                    { value: '3x3', label: '3×3' }, { value: '3x4', label: '3×4' }, { value: '4x4', label: '4×4' }
                ]
            },
            { key: 'duration', label: 'Время на выполнение', type: 'number', default: 60, min: 15, max: 300, step: 15, unit: 'сек' }
        ],
        successCriteria: { type: 'time_only', label: 'Пройти указанное время' }
    },
    'attention-test': {
        params: [
            { key: 'duration', label: 'Длительность', type: 'number', default: 180, min: 60, max: 600, step: 30, unit: 'сек' },
            { key: 'stimulusInterval', label: 'Интервал стимулов', type: 'number', default: 2, min: 1, max: 5, step: 1, unit: 'сек' }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 75, min: 50, max: 100 }
    },
    'reaction-test': {
        params: [
            { key: 'duration', label: 'Время', type: 'number', default: 60, min: 0, max: 300, step: 30, unit: 'сек' },
            { key: 'greenDuration', label: 'Время сигнала', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5, unit: 'сек' }
        ],
        successCriteria: { type: 'max_time', label: 'Макс. среднее время', unit: 'мс', default: 400, min: 100, max: 1000, step: 50 }
    },
    'auditory-test': {
        params: [
            { key: 'rounds', label: 'Количество раундов', type: 'number', default: 10, min: 5, max: 30, step: 1 },
            {
                key: 'difficulty', label: 'Сложность', type: 'select', default: 'medium', options: [
                    { value: 'easy', label: 'Легко' }, { value: 'medium', label: 'Средне' }, { value: 'hard', label: 'Сложно' }
                ]
            }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. правильных', unit: '%', default: 70, min: 50, max: 100 }
    },
    'visual-memory-test': {
        params: [
            { key: 'itemCount', label: 'Количество элементов', type: 'number', default: 5, min: 3, max: 10, step: 1 },
            { key: 'exposureTime', label: 'Время показа', type: 'number', default: 10, min: 3, max: 60, step: 1, unit: 'сек' },
            { key: 'wordMode', label: 'Слова', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'completion', label: 'Запомнить последовательность' }
    },
    'sequence-test': {
        params: [
            { key: 'startLength', label: 'Количество чисел', type: 'number', default: 7, min: 3, max: 20, step: 1 }
        ],
        successCriteria: { type: 'completion', label: 'Найти все числа' }
    },
    'tower-of-hanoi': {
        params: [
            { key: 'diskCount', label: 'Дисков', type: 'number', default: 3, min: 2, max: 7, step: 1 }
        ],
        successCriteria: { type: 'min_moves', label: 'Минимум ходов' }
    },
    'math-test': {
        params: [
            { key: 'rounds', label: 'Количество задач', type: 'number', default: 20, min: 10, max: 50, step: 5 },
            {
                key: 'difficulty', label: 'Сложность', type: 'select', default: 'medium', options: [
                    { value: 'easy', label: 'Легко (1-10)' }, { value: 'medium', label: 'Средне (1-50)' }, { value: 'hard', label: 'Сложно (1-100)' }
                ]
            }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. правильных', unit: '%', default: 80, min: 50, max: 100 }
    },
    'alphabet-game': {
        params: [
            { key: 'duration', label: 'Время', type: 'number', default: 120, min: 30, max: 600, step: 30, unit: 'сек' },
            {
                key: 'mode', label: 'Режим', type: 'select', default: 'letters', options: [
                    { value: 'letters', label: 'Буквы' }, { value: 'numbers', label: 'Цифры' }, { value: 'fingers', label: 'Пальцы' }
                ]
            },
            { key: 'speed', label: 'Скорость', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5, unit: 'сек' },
            { key: 'fontSizeScale', label: 'Размер шрифта', type: 'number', default: 1, min: 0.4, max: 2, step: 0.2 },
            { key: 'isX2Mode', label: '+ноги', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'time_only', label: 'Пройти указанное время' }
    },
    'speed-reading': {
        params: [
            { key: 'duration', label: 'Время выполнения', type: 'number', default: 60, min: 30, max: 300, step: 30, unit: 'сек' },
            { key: 'letterCount', label: 'Букв в слове', type: 'number', default: 5, min: 3, max: 8, step: 1 },
            { key: 'displayTime', label: 'Время показа', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, unit: 'сек' },
            { key: 'fontSize', label: 'Размер шрифта', type: 'number', default: 6, min: 2, max: 15, step: 1 }
        ],
        successCriteria: { type: 'time_only', label: 'Пройти указанное время' }
    },
    'vocabulary-test': {
        params: [
            { key: 'wordCount', label: 'Количество слов', type: 'number', default: 20, min: 10, max: 100, step: 10 }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 70, min: 50, max: 100 }
    },
    'pairs-test': {
        params: [
            { key: 'pairCount', label: 'Количество пар', type: 'number', default: 5, min: 2, max: 10, step: 1 },
            { key: 'pairTime', label: 'Время для запоминания', type: 'number', default: 60, min: 15, max: 300, step: 15, unit: 'сек' },
            { key: 'wordMode', label: 'Слова', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'completion', label: 'Запомнить все пары' }
    },
    'fly-test': {
        params: [
            { key: 'attempts', label: 'Раундов', type: 'number', default: 5, min: 1, max: 20, step: 1 },
            { key: 'gridSize', label: 'Размер поля', type: 'number', default: 5, min: 3, max: 10, step: 1 },
            { key: 'stepCount', label: 'Число шагов', type: 'number', default: 5, min: 2, max: 20, step: 1 },
            { key: 'stepSpeed', label: 'Скорость', type: 'number', default: 3, min: 1, max: 10, step: 1, unit: 'сек' },
            { key: 'hiddenMode', label: 'Закрыто', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'completion', label: 'Найти муху' }
    },
    'anagram-test': {
        params: [
            { key: 'letterCount', label: 'Число букв', type: 'number', default: 4, min: 3, max: 7, step: 1 },
            { key: 'anagramCount', label: 'Число анаграмм', type: 'number', default: 5, min: 1, max: 20, step: 1 },
            { key: 'timeLimit', label: 'Время на ответ', type: 'number', default: 20, min: 5, max: 60, step: 5, unit: 'сек' }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 70, min: 50, max: 100 }
    },
    'magic-forest': {
        params: [
            { key: 'level', label: 'Уровень', type: 'number', default: 1, min: 1, max: 10, step: 1 },
            { key: 'previewDuration', label: 'Время показа', type: 'number', default: 4, min: 1, max: 10, step: 1, unit: 'сек' },
            { key: 'showAnimalNames', label: 'Названия', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'completion', label: 'Найти всех зверей' }
    },
    'munsterberg-test': {
        params: [
            { key: 'duration', label: 'Время', type: 'number', default: 120, min: 30, max: 600, step: 30, unit: 'сек' },
            { key: 'showHints', label: 'Подсказки', type: 'toggle', default: true }
        ],
        successCriteria: { type: 'completion', label: 'Найти все слова' }
    },
    'calcudoku': {
        params: [
            { key: 'timeLimit', label: 'Время', type: 'number', default: 60, min: 15, max: 600, step: 15, unit: 'сек' },
            {
                key: 'size', label: 'Размер поля', type: 'select', default: 4, options: [
                    { value: 3, label: '3×3' }, { value: 4, label: '4×4' }, { value: 5, label: '5×5' },
                    { value: 6, label: '6×6' }, { value: 7, label: '7×7' }, { value: 8, label: '8×8' }, { value: 9, label: '9×9' }
                ]
            },
            {
                key: 'operations', label: 'Операции', type: 'select', default: '+ -', options: [
                    { value: '+', label: '+' }, { value: '+ -', label: '+ −' },
                    { value: '* /', label: '× ÷' }, { value: '+ - * /', label: '+ − × ÷' }
                ]
            }
        ],
        successCriteria: { type: 'max_time', label: 'Макс. время', unit: 'сек', default: 60, min: 15, max: 600, step: 15 }
    },
    'start-test': {
        params: [
            { key: 'trainingDuration', label: 'Время тренировки', type: 'number', default: 60, min: 30, max: 300, step: 30, unit: 'сек' },
            { key: 'reactionTimeLimit', label: 'Лимит реакции', type: 'number', default: 1000, min: 500, max: 3000, step: 100, unit: 'мс' }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 80, min: 50, max: 100 }
    },
    'animal-sound-test': {
        params: [
            { key: 'hideName', label: 'Скрыть названия', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 70, min: 50, max: 100 }
    },
    'fast-numbers': {
        params: [
            { key: 'rounds', label: 'Количество кругов', type: 'number', default: 3, min: 1, max: 10, step: 1 },
            { key: 'shuffle', label: 'Вразнобой', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 80, min: 50, max: 100 }
    },
    'fast-syllables': {
        params: [
            { key: 'rounds', label: 'Количество кругов', type: 'number', default: 3, min: 1, max: 10, step: 1 },
            { key: 'gridSize', label: 'Слогов на экране', type: 'number', default: 9, min: 4, max: 16, step: 1 },
            { key: 'shuffle', label: 'Вразнобой', type: 'toggle', default: false }
        ],
        successCriteria: { type: 'min_accuracy', label: 'Мин. точность', unit: '%', default: 80, min: 50, max: 100 }
    }
};
