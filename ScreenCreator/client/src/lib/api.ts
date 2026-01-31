import { queryClient } from "./queryClient";

export async function createProfile(data: any) {
    const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create profile");
    }
    return res.json();
}

export async function updateProfile(id: string, data: any) {
    const res = await fetch(`/api/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
    }
    return res.json();
}

export async function getProfile(id: string) {
    const res = await fetch(`/api/profiles/${id}`);
    if (!res.ok) {
        throw new Error("Failed to fetch profile");
    }
    return res.json();
}

export async function startAnalysis(profileId: string | undefined, prompt: string) {
    const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, prompt }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start analysis");
    }
    return res.json();
}

export async function getChatMessages(profileId: string) {
    const res = await fetch(`/api/chat/${profileId}`);
    if (!res.ok) {
        throw new Error("Failed to fetch chat messages");
    }
    return res.json();
}

export async function sendMessage(profileId: string, message: string, chatSystemPrompt?: string, currentFormData?: any) {
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, message, chatSystemPrompt, currentFormData }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
    }
    return res.json();
}

export async function getChatLogs() {
    const res = await fetch("/api/chat/logs");
    if (!res.ok) {
        throw new Error("Failed to fetch chat logs");
    }
    return res.json();
}
