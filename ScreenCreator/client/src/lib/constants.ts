export const ADHD_SECTIONS = [
    {
        title: "1. Трудности с вниманием и обучением",
        items: [
            { key: "attention_1", text: "Постоянно отвлекается на посторонние шумы или движения." },
            { key: "attention_2", text: "С трудом сидит за уроками, часто встает или ерзает." },
            { key: "attention_3", text: "Допускает много ошибок «по невнимательности» в контрольных и домашних работах." },
            { key: "attention_4", text: "Не может сосредоточиться на объяснениях учителя или родителей." },
            { key: "attention_5", text: "Часто теряет вещи (учебники, ручки, форму)." },
            { key: "attention_6", text: "Требует постоянного контроля при выполнении заданий." },
            { key: "attention_7", text: "Кажется «витающим в облаках», медленно реагирует на обращения." },
        ]
    },
    {
        title: "2. Гиперактивность и импульсивность",
        items: [
            { key: "hyperactivity_1", text: "Постоянно находится в движении (бегает, прыгает, карабкается), даже когда это неуместно." },
            { key: "hyperactivity_2", text: "Чрезмерно разговорчив, не может дождаться своей очереди в разговоре." },
            { key: "hyperactivity_3", text: "Импульсивно выкрикивает ответы, не дослушав вопрос." },
            { key: "hyperactivity_4", text: "Трудно контролирует эмоции, быстро «взрывается»." },
            { key: "hyperactivity_5", text: "Часто конфликтует со сверстниками из-за неконтролируемых реакций." },
            { key: "hyperactivity_6", text: "Сложно следовать правилам в играх." },
        ]
    },
    {
        title: "3. Эмоциональное состояние и мотивация",
        items: [
            { key: "emotional_1", text: "Быстро расстраивается и сдается при малейших неудачах." },
            { key: "emotional_2", text: "Снижена мотивация к учебе и новым занятиям, быстро теряет интерес." },
            { key: "emotional_3", text: "Часто проявляет упрямство и негативизм." },
            { key: "emotional_4", text: "Повышенная тревожность или частые беспричинные страхи." },
            { key: "emotional_5", text: "Наблюдается апатия, вялость, нежелание активно проводить время." },
        ]
    },
    {
        title: "4. Регуляция и сон",
        items: [
            { key: "regulation_1", text: "Испытывает трудности с засыпанием (не может «выключить» мозг)." },
            { key: "regulation_2", text: "Сон поверхностный, часто просыпается ночью." },
            { key: "regulation_3", text: "Утром трудно просыпается, чувствует себя неотдохнувшим." },
            { key: "regulation_4", text: "Наблюдаются тики, навязчивые движения или мышечные зажимы (скрежет зубами)." },
            { key: "regulation_5", text: "Сложно переключаться с активного занятия на спокойное." },
        ]
    }
];

export const ADHD_CHECKLIST_ITEMS = ADHD_SECTIONS.reduce((acc, section) => {
    section.items.forEach(item => {
        acc[item.key] = item.text;
    });
    return acc;
}, {} as Record<string, string>);

// Assignment Status Constants
export const AssignmentStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
} as const;

export type AssignmentStatusType = typeof AssignmentStatus[keyof typeof AssignmentStatus];

// Success Criteria Type Constants
export const SuccessCriteriaType = {
    TIME_ONLY: 'time_only',
    MAX_TIME: 'max_time',
    MIN_ACCURACY: 'min_accuracy',
    MIN_SCORE: 'min_score',
    COMPLETION: 'completion',
    MIN_MOVES: 'min_moves'
} as const;

export type SuccessCriteriaTypeValue = typeof SuccessCriteriaType[keyof typeof SuccessCriteriaType];

// Add Mode Constants
export const AddMode = {
    DATE: 'date',
    INTERVAL: 'interval'
} as const;

export type AddModeType = typeof AddMode[keyof typeof AddMode];

// Labels for UI display (Russian)
export const StatusLabels: Record<AssignmentStatusType, string> = {
    [AssignmentStatus.PENDING]: 'Ожидает',
    [AssignmentStatus.IN_PROGRESS]: 'В процессе',
    [AssignmentStatus.COMPLETED]: 'Завершено'
};
