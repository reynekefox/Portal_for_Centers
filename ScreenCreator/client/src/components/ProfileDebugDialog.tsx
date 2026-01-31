import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ProfileDebugDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string | null;
}

export default function ProfileDebugDialog({ isOpen, onClose, profileId }: ProfileDebugDialogProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && profileId) {
            setLoading(true);
            fetch(`/api/profiles/${profileId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch profile");
                    return res.json();
                })
                .then((data) => setData(data))
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen, profileId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Данные профиля (База данных)</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] w-full rounded-md border p-4 bg-slate-950 text-slate-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500">Error: {error}</div>
                    ) : (
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
