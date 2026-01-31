import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileFormData {
    profileType: "child" | "adult";
    childGender: "male" | "female";
    adultGender: "male" | "female";
    name: string;
    surname: string;
    dateOfBirth: string;
    parentName: string;
    telegramId: string;
    phone: string;
    complaint: string;
    additionalNotes: string;
}

interface ProfileFormProps {
    formData: ProfileFormData;
    setFormData: (data: Partial<ProfileFormData>) => void;
}

export default function ProfileForm({ formData, setFormData }: ProfileFormProps) {
    const {
        profileType,
        childGender,
        adultGender,
        name,
        surname,
        dateOfBirth,
        parentName,
        telegramId,
        phone,
    } = formData;

    const updateField = (field: keyof ProfileFormData, value: any) => {
        setFormData({ [field]: value });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Type and Gender Selection */}
            <div className="flex items-center gap-4">
                {/* Child Section */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => updateField("profileType", "child")}
                        className={cn(
                            "px-10 py-2 rounded-full font-medium text-sm transition-all",
                            profileType === "child"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-300 text-gray-600"
                        )}
                    >
                        Ребенок
                    </button>

                    <div className="flex gap-2 bg-blue-100 rounded-full p-1">
                        <button
                            onClick={() => updateField("childGender", "male")}
                            className={cn(
                                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                                childGender === "male"
                                    ? "bg-white text-blue-600"
                                    : "text-blue-400"
                            )}
                        >
                            ♂ Мальчик
                        </button>
                        <button
                            onClick={() => updateField("childGender", "female")}
                            className={cn(
                                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                                childGender === "female"
                                    ? "bg-white text-blue-600"
                                    : "text-blue-400"
                            )}
                        >
                            ♀ Девочка
                        </button>
                    </div>
                </div>

                {/* Adult Section */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => updateField("profileType", "adult")}
                        className={cn(
                            "px-10 py-2 rounded-full font-medium text-sm transition-all",
                            profileType === "adult"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-300 text-gray-600"
                        )}
                    >
                        Взрослый
                    </button>

                    <div className="flex gap-2 bg-blue-100 rounded-full p-1">
                        <button
                            onClick={() => updateField("adultGender", "male")}
                            className={cn(
                                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                                adultGender === "male"
                                    ? "bg-white text-blue-600"
                                    : "text-blue-400"
                            )}
                        >
                            ♂ Мужчина
                        </button>
                        <button
                            onClick={() => updateField("adultGender", "female")}
                            className={cn(
                                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                                adultGender === "female"
                                    ? "bg-white text-blue-600"
                                    : "text-blue-400"
                            )}
                        >
                            ♀ Женщина
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Fields - 2 Columns */}
            <div className="grid grid-cols-2 gap-8 gap-y-4 mb-8">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder={profileType === "child" ? "Имя ребенка" : "Имя"}
                        className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                    />
                    <input
                        type="text"
                        value={surname}
                        onChange={(e) => updateField("surname", e.target.value)}
                        placeholder={profileType === "child" ? "Фамилия ребе..." : "Фамилия"}
                        className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                    />
                    <div className="relative">
                        <input
                            type="text"
                            value={dateOfBirth}
                            onChange={(e) => updateField("dateOfBirth", e.target.value)}
                            placeholder="Дата рождени..."
                            className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 w-4 h-4" />
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={parentName}
                        onChange={(e) => updateField("parentName", e.target.value)}
                        placeholder={profileType === "child" ? "Имя родителя" : "Место работы"}
                        className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                    />
                    <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => updateField("telegramId", e.target.value)}
                        placeholder="Telegram ID"
                        className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="Телефон"
                        className="w-full px-6 py-3 bg-blue-300 text-white placeholder:text-white/80 rounded-2xl text-sm focus:outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
