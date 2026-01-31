// Storage service with abstraction layer
// Provides auto-save functionality for course drafts

const STORAGE_KEYS = {
    COURSE_DRAFT: 'courseDraft',
    LOCKED_EXERCISE_PARAMS: 'lockedExerciseParams'
} as const;

export interface CourseDraft {
    courseName: string;
    days: Array<{
        date: string | null;
        daysOffset: number | null;
        exercises: Array<{
            trainingId: string;
            parameters: Record<string, unknown>;
            requiredResult: { type: string; minValue?: number };
        }>;
    }>;
    addMode: 'date' | 'interval';
    intervalDays: number;
    lastSaved: string;
}

export const storageService = {
    // Course draft management
    saveDraft(draft: Omit<CourseDraft, 'lastSaved'>): void {
        try {
            const data: CourseDraft = {
                ...draft,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.COURSE_DRAFT, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save draft:', error);
        }
    },

    loadDraft(): CourseDraft | null {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.COURSE_DRAFT);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to load draft:', error);
            return null;
        }
    },

    clearDraft(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.COURSE_DRAFT);
        } catch (error) {
            console.warn('Failed to clear draft:', error);
        }
    },

    hasDraft(): boolean {
        return localStorage.getItem(STORAGE_KEYS.COURSE_DRAFT) !== null;
    },

    // Generic storage methods
    get<T>(key: string, defaultValue: T): T {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key: string, value: unknown): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
        }
    },

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove ${key}:`, error);
        }
    }
};

// Auto-save interval (30 seconds)
export const AUTO_SAVE_INTERVAL = 30000;
