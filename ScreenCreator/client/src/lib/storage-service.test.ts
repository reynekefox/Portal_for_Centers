import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService, AUTO_SAVE_INTERVAL } from './storage-service';

describe('storageService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('saveDraft / loadDraft', () => {
        it('should save and load a draft', () => {
            const draft = {
                courseName: 'Test Course',
                days: [
                    {
                        date: '2026-01-31',
                        daysOffset: null,
                        exercises: []
                    }
                ],
                addMode: 'date' as const,
                intervalDays: 2
            };

            storageService.saveDraft(draft);
            const loaded = storageService.loadDraft();

            expect(loaded).not.toBeNull();
            expect(loaded?.courseName).toBe('Test Course');
            expect(loaded?.days).toHaveLength(1);
            expect(loaded?.lastSaved).toBeDefined();
        });

        it('should return null when no draft exists', () => {
            const loaded = storageService.loadDraft();
            expect(loaded).toBeNull();
        });

        it('should add lastSaved timestamp', () => {
            const draft = {
                courseName: 'Test',
                days: [],
                addMode: 'interval' as const,
                intervalDays: 3
            };

            const before = new Date().toISOString();
            storageService.saveDraft(draft);
            const after = new Date().toISOString();

            const loaded = storageService.loadDraft();
            expect(loaded?.lastSaved).toBeDefined();
            expect(loaded?.lastSaved! >= before).toBe(true);
            expect(loaded?.lastSaved! <= after).toBe(true);
        });
    });

    describe('clearDraft', () => {
        it('should remove the draft', () => {
            storageService.saveDraft({
                courseName: 'Test',
                days: [],
                addMode: 'date' as const,
                intervalDays: 2
            });

            expect(storageService.hasDraft()).toBe(true);
            storageService.clearDraft();
            expect(storageService.hasDraft()).toBe(false);
        });
    });

    describe('hasDraft', () => {
        it('should return false when no draft exists', () => {
            expect(storageService.hasDraft()).toBe(false);
        });

        it('should return true when draft exists', () => {
            storageService.saveDraft({
                courseName: 'Test',
                days: [],
                addMode: 'date' as const,
                intervalDays: 2
            });
            expect(storageService.hasDraft()).toBe(true);
        });
    });

    describe('generic get/set/remove', () => {
        it('should get default value when key does not exist', () => {
            const result = storageService.get('nonexistent', 'default');
            expect(result).toBe('default');
        });

        it('should set and get values', () => {
            storageService.set('testKey', { foo: 'bar' });
            const result = storageService.get('testKey', null);
            expect(result).toEqual({ foo: 'bar' });
        });

        it('should remove values', () => {
            storageService.set('testKey', 'value');
            storageService.remove('testKey');
            const result = storageService.get('testKey', 'default');
            expect(result).toBe('default');
        });
    });

    describe('AUTO_SAVE_INTERVAL', () => {
        it('should be 30 seconds', () => {
            expect(AUTO_SAVE_INTERVAL).toBe(30000);
        });
    });
});
