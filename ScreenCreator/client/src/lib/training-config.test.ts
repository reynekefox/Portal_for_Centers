import { describe, it, expect } from 'vitest';
import { TRAINING_CONFIG } from './training-config';

describe('TRAINING_CONFIG', () => {
    it('should have all required training types', () => {
        const expectedTrainings = [
            'stroop-test',
            'schulte-table',
            'n-back',
            'correction-test',
            'reaction-test',
            'math-test',
            'anagram-test'
        ];

        expectedTrainings.forEach(training => {
            expect(TRAINING_CONFIG).toHaveProperty(training);
        });
    });

    it('each training should have params array and successCriteria', () => {
        Object.entries(TRAINING_CONFIG).forEach(([key, config]) => {
            expect(config).toHaveProperty('params');
            expect(config).toHaveProperty('successCriteria');
            expect(Array.isArray(config.params)).toBe(true);
            expect(config.successCriteria).toHaveProperty('type');
            expect(config.successCriteria).toHaveProperty('label');
        });
    });

    it('each param should have required fields', () => {
        Object.entries(TRAINING_CONFIG).forEach(([trainingKey, config]) => {
            config.params.forEach((param, index) => {
                expect(param, `${trainingKey} param ${index}`).toHaveProperty('key');
                expect(param, `${trainingKey} param ${index}`).toHaveProperty('label');
                expect(param, `${trainingKey} param ${index}`).toHaveProperty('type');
                expect(param, `${trainingKey} param ${index}`).toHaveProperty('default');
                expect(['number', 'select', 'toggle']).toContain(param.type);
            });
        });
    });

    it('select type params should have options', () => {
        Object.entries(TRAINING_CONFIG).forEach(([trainingKey, config]) => {
            config.params.forEach((param) => {
                if (param.type === 'select') {
                    expect(param.options, `${trainingKey}.${param.key}`).toBeDefined();
                    expect(Array.isArray(param.options)).toBe(true);
                    expect(param.options!.length).toBeGreaterThan(0);
                }
            });
        });
    });

    it('number type params should have min, max, step for validation', () => {
        Object.entries(TRAINING_CONFIG).forEach(([trainingKey, config]) => {
            config.params.forEach((param) => {
                if (param.type === 'number') {
                    // Most number params should have bounds
                    if (param.min !== undefined) {
                        expect(typeof param.min).toBe('number');
                    }
                    if (param.max !== undefined) {
                        expect(typeof param.max).toBe('number');
                        expect(param.max).toBeGreaterThanOrEqual(param.min ?? 0);
                    }
                }
            });
        });
    });

    it('successCriteria types should be valid', () => {
        const validTypes = ['time_only', 'max_time', 'min_accuracy', 'min_score', 'completion', 'min_moves'];

        Object.values(TRAINING_CONFIG).forEach(config => {
            expect(validTypes).toContain(config.successCriteria.type);
        });
    });
});
