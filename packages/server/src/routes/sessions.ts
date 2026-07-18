import { Hono } from "hono";
// import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { findSupportedChatModel } from "@nightcode/shared";
import { db, Role, Mode, MessageStatus } from "@nightcode/database";
import * as Sentry from "@sentry/hono/bun";

const createSessionSchema = z.object({
    title: z.string(),
    cwd: z.string().optional(),
    initialMessage: z
        .object({
            role: z.enum(Role),
            content: z.string(),
            mode: z.enum(Mode),
            model: z.string().refine((id) => !!findSupportedChatModel(id), "Unsupported model"),
        })
        .optional(),
});

const createSessionValidator = zValidator(
    "json",
    createSessionSchema, 
    (result, c) => {
        if (!result.success) {
                Sentry.logger.warn("Session creation validation failed", {
                    path: c.req.path,
                    issues: result.error.issues.length,
                });
            return c.json({ error: "Invalid request body" }, 400);
        }
    }
);

export const app = new Hono()
    .get("/", async (c) => {
        const session = await db.session.findMany({
            orderBy: { createdAt: "desc"},
            select: {
                id: true,
                title: true,
                createdAt: true,
            },
        });
        Sentry.logger.info("Listed sessions" , {
            count: session.length,
        });

        return c.json(session);
    })
    .get("/:id", async (c) => {
        await new Promise((r) => setTimeout(r, 5000))
        // throw new HTTPException(
        //     500,
        //     { message: "Mock error: session loading failed"}
        // )
        const id = c.req.param("id");
        const session = await db.session.findUnique({
            where: { id },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!session) {
            return c.json({ error: "Session not found" }, 404);
        }

        return c.json(session);
    })
    .post("/", createSessionValidator, async (c) => {
        // await new Promise((r) => setTimeout(r, 5000))
        // throw new HTTPException(
        //     500,
        //     { message: "Mock error: session loading failed"}
        // )
        const { initialMessage, ...data} = c.req.valid("json");
        const session = await db.session.create({
            data: {
                ...data,
                userId: "mock-user",
                ...(initialMessage && {
                    messages: {
                        create: {
                            ...initialMessage,
                            status: MessageStatus.COMPLETE,
                        },
                    },
                })
            },
            include: {messages: true},
        });

        Sentry.logger.info("Created session", {
            sessionId: session.id,
            title: session.title,
        });
        
        return c.json(session, 201);
    });

export default app;