import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { Mode } from "@nightcode/database/enums";
import { useNavigate, useLocation } from "react-router";
import { UserMessage, BotMessage, ErrorMessage } from "../components/messages";
import { SessionShell } from "../components/session-shell";
import { useToast } from "../providers/toast";
import { apiClient } from "../lib/api-client";
import { getErrorMessage } from "../lib/http-error";

const newSessionStateSchema = z.object({
    message: z.string(),
    mode: z.enum(Mode),
    model: z.string(),
});

export function NewSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const hasStartedRef = useRef(false);

    const state = useMemo(() => {
        const parsed = newSessionStateSchema.safeParse(location.state)
        return parsed.success ? parsed.data : null;
    }, [location.state])

    useEffect(() => {
        if (!state?.message) {
            navigate("/", { replace: true });
        }
    }, [state, navigate]);

    useEffect(() => {
        if (!state || hasStartedRef.current) return;
        hasStartedRef.current = true;
        let ignore = false;
        
        const createsession = async () => {
            try {
                // FIXED: Changed from .sessions to .session
                const res = await apiClient.sessions.$post({
                    json: {
                        title: state.message.slice(0, 100),
                        cwd: process.cwd(),
                        initialMessage: {
                            role: "USER",
                            content: state.message,
                            mode: state.mode,
                            model: state.model,
                        },
                    }
                });
                if (ignore) return;

                if (!res.ok) {
                    throw new Error(await getErrorMessage(res));
                } 
                const session = await res.json();
                navigate(`/session/${session.id}`, { replace: true, state:{
                    session
                } });
            } catch (error) {
                if (ignore) return;
                toast.show({
                    variant: "error",
                    message: error instanceof Error ? error.message : "Failed to create session",
                });
                navigate("/", { replace: true});
            }
        };
        
        createsession();
        return () => {
            ignore = true;
        };
    }, [state, navigate, toast]);
    
    if (!state) return null;

    return (
        <SessionShell onSubmit={() => { }} inputDisabled loading>
            <UserMessage message={state.message} mode={state.mode} />
        </SessionShell>
    )
}