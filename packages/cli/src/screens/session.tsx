import { SessionShell } from "../components/session-shell";
import { useParams, useLocation, useNavigate } from "react-router";
import { useKeyboard } from "@opentui/react";
import { MessageStatus } from "@nightcode/database/enums";
import { useKeyboardLayer } from "../providers/toast/keyboard-layer";
import pattyMs from "pretty-ms";
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@nightcode/shared";
import { z } from "zod";
import { useChat } from "../hooks/use-chat";
import type { Message, ClientMessagePart } from "../hooks/use-chat";
import type { InferResponseType } from "hono/client";
import { useState, useEffect, useMemo } from "react";
import { UserMessage, BotMessage, ErrorMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { apiClient } from "../lib/api-client";
import { getErrorMessage } from "../lib/http-error";
import prettyMs from "pretty-ms";

type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val),
});

function mapDbMessage(dbMessage: SessionData["messages"]): Message[] {
    return dbMessage.map((m): Message => {
        if (m.role === "ERROR") {
            return { id: m.id, role: "error", content: m.content };
        }
        if (m.role === "USER") {
            return {
                id: m.id,
                role: "user",
                content: m.content,
                mode: m.mode,
                model: m.model as SupportedChatModelId,
            };
        }

        return {
            id: m.id,
            role: "assistant",
            content: m.content,
            model: m.model as SupportedChatModelId,
            mode: m.mode,
            parts: [{ type: "text", text: m.content }],
            ...(m.duration != null ? { duration: prettyMs(m.duration * 1000) }: {}),
        };
    });
};
function ChatMessage(
    { msg }: {
        msg: Message
    }
) {
    if (msg.role === "user") {
        return <UserMessage message={msg.content} />;
    }

    if (msg.role === "error") {
        return <ErrorMessage message={msg.content} />;
    }

    return (
        <BotMessage 
            parts={msg.parts} 
            model={msg.model}
            mode={msg.mode}
            duration={msg.duration}
            streaming={false}
            interrupted={msg.interrupted}
        />
        
    );
}

function SessionChat ({ session }: { session: SessionData }) {
    const [initialMessages] = useState(() => mapDbMessage(session.messages));
    const { isTopLayer } = useKeyboardLayer();
    const { messages, streaming, submit, abort, interrupt } = useChat(session.id, initialMessages);
    useEffect(() => {
        return () => abort();
    }, [abort]);

    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && streaming.status === "streaming") {
            key.preventDefault();
            interrupt();
        }
    });

    return (
        <SessionShell
            onSubmit={(text) => 
                submit({ userText: text, mode: "BUILD", model: DEFAULT_CHAT_MODEL_ID })
            }
            loading={streaming.status === "streaming"}
            interruptible={streaming.status === "streaming"}
        >
            {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
            ))}
            {streaming.status === "streaming" && streaming.parts.length > 0 && (
                <BotMessage
                    parts={streaming.parts}
                    model={streaming.model}
                    mode={streaming.mode}
                    streaming
                />
            )}
        </SessionShell>
    );
}
export function Session() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    
    const prefetched = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data.session : null;
    }, [location.state]);

    const [session, setSession] = useState<SessionData | null>(prefetched);
    
    useEffect(() => {
        // Skip fetch if session was passed via location state
        if (prefetched) return;
        setSession(null);
        if (!id) return;
        
        let ignore = false;
        
        const fetchSession = async () => {
            try {
                const res = await apiClient.sessions[":id"].$get({ 
                    param: { id } 
                });
                
                if (ignore) return;
                if (!res.ok) throw new Error(await getErrorMessage(res));
                
                const resolved = await res.json();
                setSession(resolved);
            } catch (err) {
                if (ignore) return;
                toast.show({
                    variant: "error",
                    message: err instanceof Error ? err.message : "Failed to load session",
                });
                navigate("/", { replace: true });
            }
        };
        
        fetchSession();
        
        return () => {
            ignore = true;
        };
    }, [id, prefetched, toast, navigate]);

    if (!session) {
        return <SessionShell onSubmit={() => {}} inputDisabled loading />;
    }
    
    return (
        <SessionChat key={session.id} session={session} />
    );
}