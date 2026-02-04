import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Play, X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { TRAINING_CONFIG } from "@/lib/training-config";

interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: { type: string; minValue?: number };
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
}

interface Training {
    id: string;
    name: string;
    path: string;
}

interface Template {
    id: number;
    schoolId: number;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

interface AssignmentFormData {
    title: string;
    studentId: number;
    scheduledDate: string;
    exercises: Exercise[];
}

interface AssignmentBuilderProps {
    // Data
    assignmentFormData: AssignmentFormData;
    students: Student[];
    trainings: Training[];
    templates: Template[];
    editingAssignmentId: number | null;
    isSaving: boolean;
    lockStudent?: boolean;  // Lock student selector when creating assignment from StudentEditor

    // State setters
    onAssignmentFormDataChange: (data: AssignmentFormData) => void;
    onClose: () => void;
    onSubmit: () => void;

    // Template handlers
    onSaveAsTemplate: () => void;
    onLoadTemplate: (template: Template) => void;
    onUpdateTemplate: (id: number) => void;
    onDeleteTemplate: (id: number) => void;
    templateName: string;
    onTemplateNameChange: (name: string) => void;

    // Utility
    getTrainingName: (id: string) => string;
}

export function AssignmentBuilder({
    assignmentFormData,
    students,
    trainings,
    templates,
    editingAssignmentId,
    isSaving,
    lockStudent = false,
    onAssignmentFormDataChange,
    onClose,
    onSubmit,
    onSaveAsTemplate,
    onLoadTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    templateName,
    onTemplateNameChange,
    getTrainingName
}: AssignmentBuilderProps) {
    // Local state
    const [showTemplates, setShowTemplates] = useState(false);
    const [exercisesExpanded, setExercisesExpanded] = useState(true);
    const [draggedExercise, setDraggedExercise] = useState<number | null>(null);
    const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
    const [currentExercise, setCurrentExercise] = useState<Exercise>({
        trainingId: '',
        parameters: {},
        requiredResult: { type: 'completion' }
    });
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

    const handleExerciseDragStart = (index: number) => {
        setDraggedExercise(index);
    };

    const handleExerciseDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedExercise === null || draggedExercise === index) return;

        const newExercises = [...assignmentFormData.exercises];
        const [movedExercise] = newExercises.splice(draggedExercise, 1);
        newExercises.splice(index, 0, movedExercise);

        onAssignmentFormDataChange({
            ...assignmentFormData,
            exercises: newExercises
        });
        setDraggedExercise(index);
    };

    const handleExerciseDragEnd = () => {
        setDraggedExercise(null);
    };

    const handleEditExercise = (index: number) => {
        const exercise = assignmentFormData.exercises[index];
        setCurrentExercise(exercise);
        setEditingExerciseIndex(index);
        setShowExerciseBuilder(true);
    };

    const handleRemoveExercise = (index: number) => {
        onAssignmentFormDataChange({
            ...assignmentFormData,
            exercises: assignmentFormData.exercises.filter((_, i) => i !== index)
        });
    };

    const addExerciseToAssignment = () => {
        if (editingExerciseIndex !== null) {
            const newExercises = [...assignmentFormData.exercises];
            newExercises[editingExerciseIndex] = currentExercise;
            onAssignmentFormDataChange({
                ...assignmentFormData,
                exercises: newExercises
            });
        } else {
            onAssignmentFormDataChange({
                ...assignmentFormData,
                exercises: [...assignmentFormData.exercises, currentExercise]
            });
        }
        setShowExerciseBuilder(false);
        setEditingExerciseIndex(null);
        setCurrentExercise({ trainingId: '', parameters: {}, requiredResult: { type: 'completion' } });
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingAssignmentId ? 'Редактировать занятие' : 'Создать занятие'}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    {/* Templates dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-all"
                        >
                            📋 Шаблоны
                        </button>
                        {showTemplates && (
                            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h4 className="font-bold text-gray-800 mb-2">Сохранить как шаблон</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => onTemplateNameChange(e.target.value)}
                                            placeholder="Название шаблона"
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={onSaveAsTemplate}
                                            disabled={!templateName.trim() || assignmentFormData.exercises.length === 0}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium"
                                        >
                                            💾
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {templates.length === 0 ? (
                                        <p className="text-gray-400 text-center py-4 text-sm">Нет сохранённых шаблонов</p>
                                    ) : (
                                        templates.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                <button
                                                    onClick={() => onLoadTemplate(t)}
                                                    className="flex-1 text-left"
                                                >
                                                    <span className="font-medium text-gray-800">{t.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({t.exercises.length} упр.)</span>
                                                </button>
                                                <button
                                                    onClick={() => onUpdateTemplate(t.id)}
                                                    disabled={assignmentFormData.exercises.length === 0}
                                                    className="p-1 hover:bg-blue-100 rounded text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Перезаписать текущими упражнениями"
                                                >
                                                    ⬆️
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTemplate(t.id)}
                                                    className="p-1 hover:bg-red-100 rounded text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onSubmit}
                        disabled={isSaving || assignmentFormData.exercises.length === 0 || !assignmentFormData.title}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-all"
                    >
                        {isSaving ? 'Сохранение...' : 'Сохранить занятие'}
                    </button>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Form & Exercise List */}
                <div className="w-1/2 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Название занятия</label>
                            <input
                                type="text"
                                value={assignmentFormData.title}
                                onChange={(e) => onAssignmentFormDataChange({ ...assignmentFormData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-lg"
                                placeholder="Занятие на внимание"
                            />
                        </div>

                        {/* Date & Student */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                                <input
                                    type="date"
                                    value={assignmentFormData.scheduledDate}
                                    onChange={(e) => onAssignmentFormDataChange({ ...assignmentFormData, scheduledDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-lg"
                                    style={{ fontSize: '18px' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ученик</label>
                                {lockStudent && assignmentFormData.studentId > 0 ? (
                                    <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                                        {students.find(s => s.id === assignmentFormData.studentId)?.first_name}{' '}
                                        {students.find(s => s.id === assignmentFormData.studentId)?.last_name}
                                        <span className="ml-2 text-xs text-gray-400">(нельзя изменить)</span>
                                    </div>
                                ) : (
                                    <select
                                        value={assignmentFormData.studentId}
                                        onChange={(e) => onAssignmentFormDataChange({ ...assignmentFormData, studentId: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                    >
                                        <option value={0}>Без ученика</option>
                                        {students.map((s) => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Exercises List */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setExercisesExpanded(!exercisesExpanded)}
                                className="flex items-center justify-between w-full text-left mb-3 group"
                            >
                                <span className="text-xl font-bold text-gray-800">
                                    Упражнения ({assignmentFormData.exercises.length})
                                </span>
                                {assignmentFormData.exercises.length > 0 && (
                                    exercisesExpanded
                                        ? <ChevronUp size={24} className="text-gray-500 group-hover:text-gray-700" />
                                        : <ChevronDown size={24} className="text-gray-500 group-hover:text-gray-700" />
                                )}
                            </button>
                            {assignmentFormData.exercises.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
                                    <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>Выберите тренинги справа</p>
                                    <p className="text-sm">для добавления в занятие</p>
                                </div>
                            ) : exercisesExpanded ? (
                                <div className="space-y-2">
                                    {assignmentFormData.exercises.map((ex, i) => (
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={() => handleExerciseDragStart(i)}
                                            onDragOver={(e) => handleExerciseDragOver(e, i)}
                                            onDragEnd={handleExerciseDragEnd}
                                            className={`flex items-center gap-3 bg-gray-50 rounded-xl p-4 cursor-move transition-all ${draggedExercise === i ? 'opacity-50 scale-95' : 'hover:bg-gray-100'}`}
                                        >
                                            <div className="text-gray-400 hover:text-gray-600">
                                                <GripVertical size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800">{i + 1}. {getTrainingName(ex.trainingId)}</span>
                                                    <span className="text-sm text-gray-500">
                                                        ({ex.requiredResult.type === 'completion' || ex.requiredResult.type === 'time_only' || ex.requiredResult.type === 'min_moves'
                                                            ? '✔'
                                                            : `≥${ex.requiredResult.minValue}${ex.requiredResult.type === 'max_time' ? ' сек' : '%'}`})
                                                    </span>
                                                </div>
                                                {Object.keys(ex.parameters).length > 0 && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {Object.entries(ex.parameters).map(([key, val]) => {
                                                            const config = TRAINING_CONFIG[ex.trainingId as keyof typeof TRAINING_CONFIG];
                                                            const param = config?.params?.find((p: { key: string }) => p.key === key);
                                                            const legacyLabels: Record<string, string> = {
                                                                exerciseDuration: 'Время (сек)',
                                                                duration: 'Время (сек)',
                                                                wordCount: 'Кол-во слов',
                                                                diskCount: 'Дисков',
                                                                gridSize: 'Размер поля',
                                                                rounds: 'Раундов',
                                                                speed: 'Скорость',
                                                                fontSize: 'Размер шрифта'
                                                            };
                                                            const label = param?.label || legacyLabels[key] || key;
                                                            return `${label}: ${val}`;
                                                        }).join(' • ')}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleEditExercise(i)}
                                                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all"
                                            >
                                                <Pencil size={18} className="text-blue-600" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExercise(i)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition-all"
                                            >
                                                <X size={18} className="text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right Column - Available Trainings */}
                <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Доступные тренинги</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {trainings.map((training) => (
                            <button
                                key={training.id}
                                onClick={() => {
                                    const config = TRAINING_CONFIG[training.id];
                                    const defaultParams: Record<string, unknown> = {};
                                    if (config) {
                                        config.params.forEach(p => { defaultParams[p.key] = p.default; });
                                    }
                                    const criteria = config?.successCriteria;
                                    setCurrentExercise({
                                        trainingId: training.id,
                                        parameters: defaultParams,
                                        requiredResult: {
                                            type: criteria?.type || 'completion',
                                            minValue: criteria?.default
                                        }
                                    });
                                    setShowExerciseBuilder(true);
                                }}
                                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Play size={24} className="text-blue-600" />
                                    <Plus size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <h4 className="font-bold text-gray-800 text-lg">{training.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    {TRAINING_CONFIG[training.id]?.successCriteria?.label || 'Нажмите для настройки'}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Exercise Builder Modal */}
            {showExerciseBuilder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingExerciseIndex !== null ? 'Редактировать упражнение' : 'Добавить упражнение'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Тренинг</label>
                                <select
                                    value={currentExercise.trainingId}
                                    onChange={(e) => {
                                        const trainingId = e.target.value;
                                        const config = TRAINING_CONFIG[trainingId];
                                        const defaultParams: Record<string, unknown> = {};
                                        if (config) {
                                            config.params.forEach(p => { defaultParams[p.key] = p.default; });
                                        }
                                        const criteria = config?.successCriteria;
                                        setCurrentExercise({
                                            ...currentExercise,
                                            trainingId,
                                            parameters: defaultParams,
                                            requiredResult: {
                                                type: criteria?.type || 'completion',
                                                minValue: criteria?.default
                                            }
                                        });
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Выберите тренинг</option>
                                    {trainings.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Training-specific parameters */}
                            {currentExercise.trainingId && TRAINING_CONFIG[currentExercise.trainingId] && (
                                <div className="border-t border-gray-200 pt-4">
                                    {TRAINING_CONFIG[currentExercise.trainingId].params.map((param) => (
                                        <div key={param.key} className="mb-3">
                                            <label className="block text-sm text-gray-600 mb-1">{param.label}</label>
                                            {param.type === 'number' ? (
                                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = (currentExercise.parameters[param.key] as number) ?? param.default;
                                                            const step = param.step || 1;
                                                            const newVal = Math.max(param.min ?? 0, current - step);
                                                            setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: newVal }
                                                            });
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                    >−</button>
                                                    <div className="flex items-center gap-1 min-w-[4rem] justify-center">
                                                        <span className="font-bold text-xl text-gray-800">
                                                            {(currentExercise.parameters[param.key] as number) ?? param.default}
                                                        </span>
                                                        {param.unit && <span className="text-gray-500 text-sm">{param.unit}</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const current = (currentExercise.parameters[param.key] as number) ?? param.default;
                                                            const step = param.step || 1;
                                                            const newVal = Math.min(param.max ?? 999, current + step);
                                                            setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: newVal }
                                                            });
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                    >+</button>
                                                </div>
                                            ) : param.type === 'toggle' ? (
                                                <div className="flex items-center justify-end -mt-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentExercise({
                                                            ...currentExercise,
                                                            parameters: { ...currentExercise.parameters, [param.key]: !(currentExercise.parameters[param.key] as boolean) }
                                                        })}
                                                        className={`w-12 h-6 rounded-full transition-all ${(currentExercise.parameters[param.key] as boolean) ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${(currentExercise.parameters[param.key] as boolean) ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`grid gap-1 bg-gray-100 p-1 rounded-lg ${param.options?.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                    {param.options?.map((opt) => (
                                                        <button
                                                            key={String(opt.value)}
                                                            type="button"
                                                            onClick={() => setCurrentExercise({
                                                                ...currentExercise,
                                                                parameters: { ...currentExercise.parameters, [param.key]: isNaN(Number(opt.value)) ? opt.value : Number(opt.value) }
                                                            })}
                                                            className={`py-2 px-2 rounded-md text-sm font-bold transition-all text-center ${(currentExercise.parameters[param.key] ?? param.default) === opt.value
                                                                ? 'bg-white shadow text-blue-600'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Success criteria - auto from config */}
                            {currentExercise.trainingId && TRAINING_CONFIG[currentExercise.trainingId] && (
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Критерий успеха</label>
                                    {(() => {
                                        const criteria = TRAINING_CONFIG[currentExercise.trainingId].successCriteria;
                                        if (criteria.type === 'time_only' || criteria.type === 'completion' || criteria.type === 'min_moves') {
                                            const label = criteria.type === 'min_moves' && currentExercise.parameters.diskCount
                                                ? `Завершить за ${Math.pow(2, Number(currentExercise.parameters.diskCount)) - 1} ходов`
                                                : criteria.label;
                                            return (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                                                    ✔ {label}
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = currentExercise.requiredResult.minValue ?? criteria.default ?? 0;
                                                        const step = criteria.step ?? (criteria.type === 'max_time' ? 10 : 5);
                                                        const newVal = Math.max(criteria.min ?? 0, current - step);
                                                        setCurrentExercise({
                                                            ...currentExercise,
                                                            requiredResult: { ...currentExercise.requiredResult, minValue: newVal }
                                                        });
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                >−</button>
                                                <div className="flex items-center gap-1 min-w-[4rem] justify-center">
                                                    <span className="font-bold text-xl text-gray-800">
                                                        {currentExercise.requiredResult.minValue ?? criteria.default}
                                                    </span>
                                                    {criteria.unit && <span className="text-gray-500 text-sm">{criteria.unit}</span>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = currentExercise.requiredResult.minValue ?? criteria.default ?? 0;
                                                        const step = criteria.step ?? (criteria.type === 'max_time' ? 10 : 5);
                                                        const newVal = Math.min(criteria.max ?? 999, current + step);
                                                        setCurrentExercise({
                                                            ...currentExercise,
                                                            requiredResult: { ...currentExercise.requiredResult, minValue: newVal }
                                                        });
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                                >+</button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowExerciseBuilder(false);
                                        setEditingExerciseIndex(null);
                                        setCurrentExercise({ trainingId: '', parameters: {}, requiredResult: { type: 'completion' } });
                                    }}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    onClick={addExerciseToAssignment}
                                    disabled={!currentExercise.trainingId}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all"
                                >
                                    {editingExerciseIndex !== null ? 'Сохранить' : 'Добавить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
