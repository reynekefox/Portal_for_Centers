import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type ProfileType = "child" | "adult" | null;

export default function SelectProfile() {
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [deletedProfileIds, setDeletedProfileIds] = useState<Set<string>>(new Set());

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles");
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return res.json();
    },
  });

  const filteredProfiles = useMemo(() => {
    let filtered: typeof profiles = profiles;

    // Filter out locally deleted profiles
    filtered = filtered.filter((p: any) => !deletedProfileIds.has(p.id));

    if (profileType) {
      filtered = filtered.filter((p: any) => p.profileType === profileType);
    }

    if (searchQuery) {
      filtered = filtered.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [profiles, profileType, searchQuery, deletedProfileIds]);

  const handleSelectProfile = (profileId: string) => {
    setLocation(`/profile/${profileId}`);
  };

  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (!profileToDelete) return;

    // Immediately hide from UI
    setDeletedProfileIds(prev => new Set(prev).add(profileToDelete));
    setProfileToDelete(null);

    fetch(`/api/profiles/${profileToDelete}`, { method: "DELETE" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to delete");
        }
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
      })
      .catch((err) => {
        console.error("Failed to delete profile:", err);
        // Revert if failed
        setDeletedProfileIds(prev => {
          const next = new Set(prev);
          next.delete(profileToDelete);
          return next;
        });
        alert("Не удалось удалить профиль");
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center gap-4 z-10">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-gray-100 transition-all font-medium">
            <ArrowLeft size={18} />
            <span className="text-sm">Назад</span>
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Выбор профиля</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col max-w-2xl mx-auto w-full">
        {/* Filter Buttons */}
        <div className="flex gap-8 mb-8">
          <button
            onClick={() => setProfileType(profileType === "child" ? null : "child")}
            className={cn(
              "px-8 py-2 rounded-full font-medium text-sm transition-all",
              profileType === "child"
                ? "bg-white0 text-white"
                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
            )}
          >
            Ребенок
          </button>
          <button
            onClick={() => setProfileType(profileType === "adult" ? null : "adult")}
            className={cn(
              "px-8 py-2 rounded-full font-medium text-sm transition-all",
              profileType === "adult"
                ? "bg-white0 text-white"
                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
            )}
          >
            Взрослый
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск"
            className="w-full pl-14 pr-6 py-3 bg-blue-100 text-white placeholder:text-blue-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Profiles List */}
        <div className="flex-1 bg-blue-50 rounded-3xl p-6 space-y-3 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Загрузка...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Профили не найдены</div>
          ) : (
            filteredProfiles.map((profile: any) => (
              <div key={profile.id} className="relative group">
                <button
                  onClick={() => handleSelectProfile(profile.id)}
                  className="w-full bg-white rounded-2xl px-6 py-4 text-left text-gray-800 font-medium hover:bg-gray-50 transition-all border border-cyan-200 pr-12"
                >
                  {profile.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileToDelete(profile.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Link href="/" className="flex-1">
            <button className="w-full py-3 bg-blue-400 text-white rounded-full text-base font-medium hover:bg-blue-500 transition-all">
              Назад
            </button>
          </Link>
          <button
            disabled={!filteredProfiles.length}
            className="flex-1 py-3 bg-blue-500 text-white rounded-full text-base font-medium hover:bg-indigo-600 transition-all disabled:bg-gray-400"
          >
            Выбрать
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Удалить профиль?</h3>
            <p className="text-gray-500 mb-6">Это действие нельзя будет отменить.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setProfileToDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
