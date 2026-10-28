import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api, { API, getToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [convId, setConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [streaming, setStreaming] = useState(false);
    const abortRef = useRef(null);
    const prevUserIdRef = useRef(undefined);

    const getConvKey = useCallback((uid) => uid ? `nexus_active_conv_id_${uid}` : "nexus_active_conv_id", []);

    const loadConversations = useCallback(async () => {
        try {
            const token = getToken();
            if (!token || !user?.id) {
                setConversations([]);
                setMessages([]);
                setConvId(null);
                return;
            }
            const { data } = await api.get("/chat/conversations");
            const list = data.conversations || [];
            setConversations(list);

            const userConvKey = getConvKey(user.id);
            const savedId = localStorage.getItem(userConvKey);
            if (savedId && list.some((c) => c.id === savedId)) {
                try {
                    const res = await api.get(`/chat/conversations/${savedId}/messages`);
                    setMessages(res.data.messages || []);
                    setConvId(savedId);
                } catch {
                    localStorage.removeItem(userConvKey);
                    setConvId(null);
                    setMessages([]);
                }
            } else {
                localStorage.removeItem(userConvKey);
                setConvId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error("Error loading chat conversations:", err);
        }
    }, [user?.id, getConvKey]);

    // Handle user authentication switch (e.g. Admin -> Arun Kumar, or Logout)
    useEffect(() => {
        const currentUid = user?.id || null;
        if (prevUserIdRef.current !== currentUid) {
            prevUserIdRef.current = currentUid;
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch { /* ignore */ }
                abortRef.current = null;
            }
            setStreaming(false);
            setInput("");
            setAttachments([]);
            setConvId(null);
            setMessages([]);
            setConversations([]);

            if (currentUid) {
                loadConversations();
            }
        }
    }, [user?.id, loadConversations]);

    const openConversation = useCallback(async (id) => {
        if (!id) return;
        setConvId(id);
        if (user?.id) {
            localStorage.setItem(getConvKey(user.id), id);
        }
        try {
            const { data } = await api.get(`/chat/conversations/${id}/messages`);
            setMessages(data.messages || []);
        } catch (err) {
            console.error("Failed to load conversation:", err);
            toast.error("Failed to load conversation");
        }
    }, [user?.id, getConvKey]);

    const newChat = useCallback(() => {
        if (streaming && abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
        setConvId(null);
        setMessages([]);
        setInput("");
        setAttachments([]);
        if (user?.id) {
            localStorage.removeItem(getConvKey(user.id));
        }
    }, [streaming, user?.id, getConvKey]);

    const deleteConversation = useCallback(async (id, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            await api.delete(`/chat/conversations/${id}`);
            if (id === convId) {
                newChat();
            }
            await loadConversations();
            toast.success("Conversation deleted");
        } catch (err) {
            console.error("Failed to delete conversation:", err);
            toast.error("Failed to delete conversation");
        }
    }, [convId, newChat, loadConversations]);

    const stopStreaming = useCallback(() => {
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
            abortRef.current = null;
        }
        setStreaming(false);
    }, []);

    const send = useCallback(async (customQuestion = null, customAttachments = null) => {
        const question = (customQuestion !== null ? customQuestion : input).trim();
        const activeAttachments = customAttachments !== null ? customAttachments : attachments;
        const hasAttachments = activeAttachments.length > 0;

        if ((!question && !hasAttachments) || streaming) return;

        const currentAttachments = [...activeAttachments];
        const effectiveQuestion = question || (hasAttachments ? `Analyze and explain this attached ${currentAttachments[0].name}.` : "");

        setInput("");
        setAttachments([]);
        setStreaming(true);

        const userMsg = {
            role: "user",
            content: effectiveQuestion,
            attachments: currentAttachments.map((a) => ({
                name: a.name,
                size: a.size,
                isImage: a.isImage,
                previewUrl: a.previewUrl,
                docId: a.docId,
                content: a.base64 || a.content || undefined,
            })),
        };
        const assistant = { role: "assistant", content: "", sources: [], latency: null };
        setMessages((m) => [...m, userMsg, assistant]);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const resp = await fetch(`${API}/chat/stream`, {
                method: "POST",
                signal: controller.signal,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    question: effectiveQuestion,
                    conversation_id: convId,
                    attachments: currentAttachments.map((a) => ({
                        name: a.name,
                        size: a.size,
                        doc_id: a.docId,
                        is_image: a.isImage,
                        content: a.base64 || a.content || undefined,
                    })),
                }),
            });

            if (!resp.ok || !resp.body) throw new Error("Stream failed");

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let firstConv = convId;

            // 60fps token streaming batch accumulator to eliminate React re-render lag
            let pendingContent = "";
            let rafId = null;

            const flushContent = () => {
                if (!pendingContent) return;
                const chunk = pendingContent;
                pendingContent = "";
                setMessages((m) => {
                    const copy = [...m];
                    if (copy.length > 0) {
                        copy[copy.length - 1] = {
                            ...copy[copy.length - 1],
                            content: copy[copy.length - 1].content + chunk,
                        };
                    }
                    return copy;
                });
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop();
                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    let obj;
                    try { obj = JSON.parse(part.slice(6)); } catch { continue; }
                    if (obj.type === "meta") {
                        firstConv = obj.conversation_id;
                        setConvId(obj.conversation_id);
                        if (user?.id) {
                            localStorage.setItem(getConvKey(user.id), obj.conversation_id);
                        }
                        setMessages((m) => {
                            const copy = [...m];
                            if (copy.length > 0) {
                                copy[copy.length - 1] = {
                                    ...copy[copy.length - 1],
                                    sources: obj.sources,
                                    latency: obj.latency,
                                    rankings: obj.rankings,
                                };
                            }
                            return copy;
                        });
                    } else if (obj.type === "token") {
                        pendingContent += obj.content;
                        if (!rafId) {
                            rafId = requestAnimationFrame(() => {
                                flushContent();
                                rafId = null;
                            });
                        }
                    } else if (obj.type === "file") {
                        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                        flushContent();
                        const { type: _t, ...fileMeta } = obj;
                        setMessages((m) => {
                            const copy = [...m];
                            if (copy.length > 0) {
                                copy[copy.length - 1] = { ...copy[copy.length - 1], file: fileMeta };
                            }
                            return copy;
                        });
                    } else if (obj.type === "done") {
                        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                        flushContent();
                        setMessages((m) => {
                            const copy = [...m];
                            if (copy.length > 0) {
                                const last = copy[copy.length - 1];
                                copy[copy.length - 1] = {
                                    ...last,
                                    content: typeof obj.content === "string" ? obj.content : last.content,
                                    latency: obj.latency,
                                    backend: obj.backend,
                                };
                            }
                            return copy;
                        });
                    } else if (obj.type === "error") {
                        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                        flushContent();
                        toast.error(obj.message || "Generation error");
                    }
                }
            }

            if (!convId && firstConv) {
                loadConversations();
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                toast.error("Streaming failed: " + err.message);
            }
        } finally {
            abortRef.current = null;
            setStreaming(false);
            loadConversations();
        }
    }, [input, attachments, streaming, convId, loadConversations]);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                convId,
                messages,
                setMessages,
                input,
                setInput,
                attachments,
                setAttachments,
                streaming,
                loadConversations,
                openConversation,
                newChat,
                deleteConversation,
                stopStreaming,
                send,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
