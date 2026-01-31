import { describe, it, expect } from 'vitest';
import {
    AssignmentStatus,
    SuccessCriteriaType,
    AddMode,
    StatusLabels,
    AssignmentStatusType,
    SuccessCriteriaTypeValue,
    AddModeType
} from './constants';

describe('AssignmentStatus', () => {
    it('should have all status values', () => {
        expect(AssignmentStatus.PENDING).toBe('pending');
        expect(AssignmentStatus.IN_PROGRESS).toBe('in_progress');
        expect(AssignmentStatus.COMPLETED).toBe('completed');
    });

    it('should be readonly (const assertion)', () => {
        // TypeScript will prevent modification at compile time
        // This test verifies the values are correct
        const statuses: AssignmentStatusType[] = ['pending', 'in_progress', 'completed'];
        expect(Object.values(AssignmentStatus)).toEqual(statuses);
    });
});

describe('SuccessCriteriaType', () => {
    it('should have all criteria types', () => {
        expect(SuccessCriteriaType.TIME_ONLY).toBe('time_only');
        expect(SuccessCriteriaType.MAX_TIME).toBe('max_time');
        expect(SuccessCriteriaType.MIN_ACCURACY).toBe('min_accuracy');
        expect(SuccessCriteriaType.MIN_SCORE).toBe('min_score');
        expect(SuccessCriteriaType.COMPLETION).toBe('completion');
        expect(SuccessCriteriaType.MIN_MOVES).toBe('min_moves');
    });

    it('should have 6 criteria types', () => {
        expect(Object.keys(SuccessCriteriaType)).toHaveLength(6);
    });
});

describe('AddMode', () => {
    it('should have date and interval modes', () => {
        expect(AddMode.DATE).toBe('date');
        expect(AddMode.INTERVAL).toBe('interval');
    });
});

describe('StatusLabels', () => {
    it('should have Russian labels for all statuses', () => {
        expect(StatusLabels[AssignmentStatus.PENDING]).toBe('Ожидает');
        expect(StatusLabels[AssignmentStatus.IN_PROGRESS]).toBe('В процессе');
        expect(StatusLabels[AssignmentStatus.COMPLETED]).toBe('Завершено');
    });

    it('should have labels for all AssignmentStatus values', () => {
        Object.values(AssignmentStatus).forEach(status => {
            expect(StatusLabels[status]).toBeDefined();
            expect(typeof StatusLabels[status]).toBe('string');
            expect(StatusLabels[status].length).toBeGreaterThan(0);
        });
    });
});
