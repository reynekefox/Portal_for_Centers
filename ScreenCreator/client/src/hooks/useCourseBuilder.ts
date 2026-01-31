import { useState, useCallback } from 'react';
import { authApi } from '@/lib/auth-store';

export interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: { type: string; minValue?: number };
}

export interface CourseDay {
    date: string | null;
    daysOffset: number | null;
    exercises: Exercise[];
}

export interface SavedCourse {
    id: number;
    name: string;
    days: CourseDay[];
}

export interface CourseBuilderData {
    studentId: number;
    days: CourseDay[];
    templateId: number | null;
    addMode: 'date' | 'interval';
    intervalDays: number;
    nextDate: string;
    courseName: string;
}

const initialCourseData: CourseBuilderData = {
    studentId: 0,
    days: [],
    templateId: null,
    addMode: 'date',
    intervalDays: 2,
    nextDate: new Date().toISOString().split('T')[0],
    courseName: ''
};

export function useCourseBuilder(userId: number | undefined) {
    const [showCourseBuilder, setShowCourseBuilder] = useState(false);
    const [courseData, setCourseData] = useState<CourseBuilderData>(initialCourseData);
    const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
    const [showSavedCourses, setShowSavedCourses] = useState(true);
    const [overwriteConfirm, setOverwriteConfirm] = useState<{
        show: boolean;
        existingCourse: { id: number; name: string } | null
    }>({ show: false, existingCourse: null });

    // Load saved courses
    const loadSavedCourses = useCallback(async () => {
        if (!userId) return;
        const courses = await authApi.getCourseTemplates(userId);
        setSavedCourses(courses);
    }, [userId]);

    // Add a new course day
    const addCourseDay = useCallback((template: { exercises: Exercise[] } | undefined) => {
        if (!template) return;

        setCourseData(prev => {
            let newDay: CourseDay;

            if (prev.addMode === 'interval') {
                // Calculate next offset based on existing days
                const lastOffset = prev.days.length > 0
                    ? Math.max(...prev.days.map(d => d.daysOffset ?? 0))
                    : -prev.intervalDays;
                newDay = {
                    date: null,
                    daysOffset: lastOffset + prev.intervalDays,
                    exercises: template.exercises.map(e => ({ ...e }))
                };
            } else {
                newDay = {
                    date: prev.nextDate,
                    daysOffset: null,
                    exercises: template.exercises.map(e => ({ ...e }))
                };
            }

            return { ...prev, days: [...prev.days, newDay] };
        });
    }, []);

    // Remove a course day
    const removeCourseDay = useCallback((index: number) => {
        setCourseData(prev => ({
            ...prev,
            days: prev.days.filter((_, i) => i !== index)
        }));
    }, []);

    // Save course template
    const saveCourse = useCallback(async () => {
        if (!userId || courseData.days.length === 0 || !courseData.courseName.trim()) return;

        const trimmedName = courseData.courseName.trim();
        const existingCourse = savedCourses.find(
            c => c.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingCourse) {
            setOverwriteConfirm({ show: true, existingCourse });
            return;
        }

        const result = await authApi.createCourseTemplate({
            schoolId: userId,
            name: trimmedName,
            days: courseData.days
        });
        setSavedCourses(prev => [result, ...prev]);
    }, [userId, courseData, savedCourses]);

    // Confirm overwrite
    const confirmOverwrite = useCallback(async () => {
        if (!overwriteConfirm.existingCourse || !userId) return;

        await authApi.updateCourseTemplate(overwriteConfirm.existingCourse.id, {
            name: courseData.courseName.trim(),
            days: courseData.days
        });

        setSavedCourses(prev => prev.map(c =>
            c.id === overwriteConfirm.existingCourse!.id
                ? { ...c, name: courseData.courseName.trim(), days: courseData.days }
                : c
        ));
        setOverwriteConfirm({ show: false, existingCourse: null });
    }, [userId, courseData, overwriteConfirm]);

    // Cancel overwrite
    const cancelOverwrite = useCallback(() => {
        setOverwriteConfirm({ show: false, existingCourse: null });
    }, []);

    // Load a saved course
    const loadCourse = useCallback((course: SavedCourse) => {
        setCourseData(prev => ({
            ...prev,
            days: course.days || [],
            courseName: course.name
        }));
    }, []);

    // Delete a saved course
    const deleteCourse = useCallback(async (courseId: number) => {
        await authApi.deleteCourseTemplate(courseId);
        setSavedCourses(prev => prev.filter(c => c.id !== courseId));
    }, []);

    // Reset course builder
    const resetCourseBuilder = useCallback(() => {
        setCourseData(initialCourseData);
    }, []);

    // Check if can save
    const canSave = courseData.days.length > 0 && courseData.courseName.trim().length > 0;

    return {
        // State
        showCourseBuilder,
        setShowCourseBuilder,
        courseData,
        setCourseData,
        savedCourses,
        showSavedCourses,
        setShowSavedCourses,
        overwriteConfirm,

        // Actions
        loadSavedCourses,
        addCourseDay,
        removeCourseDay,
        saveCourse,
        confirmOverwrite,
        cancelOverwrite,
        loadCourse,
        deleteCourse,
        resetCourseBuilder,

        // Computed
        canSave
    };
}
