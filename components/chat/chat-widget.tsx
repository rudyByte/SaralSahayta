'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_TURNS = 6;

const STARTERS = [
    'Which schemes match my profile?',
    'What documents do I need to apply?',
    'How does the match score work?',
    'What does Premium cost?',
];

interface SourceChip {
    id: string;
    kind: string;
    title: string;
    href?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: SourceChip[];
    grounded?: boolean;
    isError?: boolean;
}

const GREETING: Message = {
    id: 'greeting',
    role: 'assistant',
    content:
        'Namaste. I answer using only what is stored in Saral Sahayta — schemes, your documents, and your applications. Ask me about eligibility, documents, or how a page works.',
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([GREETING]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isSending]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const send = useCallback(
        async (rawText: string) => {
            const text = rawText.trim();
            if (!text || isSending) return;

            const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: text };

            // Snapshot the transcript before the new turn so the server sees the
            // same history the user sees.
            const history = messages
                .filter((message) => message.id !== 'greeting' && !message.isError)
                .slice(-HISTORY_TURNS)
                .map((message) => ({ role: message.role, content: message.content }));

            setMessages((previous) => [...previous, userMessage]);
            setInput('');
            setIsSending(true);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || 'The assistant could not answer right now.');
                }

                setMessages((previous) => [
                    ...previous,
                    {
                        id: `a-${Date.now()}`,
                        role: 'assistant',
                        content: data.answer,
                        sources: data.sources || [],
                        grounded: Boolean(data.grounded),
                    },
                ]);
            } catch (error: any) {
                setMessages((previous) => [
                    ...previous,
                    {
                        id: `e-${Date.now()}`,
                        role: 'assistant',
                        content: error?.message || 'Something went wrong. Please try again.',
                        isError: true,
                    },
                ]);
            } finally {
                setIsSending(false);
                inputRef.current?.focus();
            }
        },
        [isSending, messages]
    );

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void send(input);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void send(input);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:right-6"
                        role="dialog"
                        aria-label="Sahayak assistant"
                    >
                        <header className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">Sahayak</p>
                                <p className="truncate text-xs opacity-80">Answers from Saral Sahayta records only</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-1 transition-colors hover:bg-white/15"
                                aria-label="Close assistant"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
                            {messages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}

                            {messages.length === 1 && (
                                <div className="space-y-2 pt-1">
                                    {STARTERS.map((starter) => (
                                        <button
                                            key={starter}
                                            type="button"
                                            onClick={() => void send(starter)}
                                            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary hover:bg-accent"
                                        >
                                            {starter}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isSending && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Checking Saral Sahayta records…
                                </div>
                            )}
                        </div>

                        <form onSubmit={onSubmit} className="border-t border-border bg-card p-3">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                                    onKeyDown={onKeyDown}
                                    rows={1}
                                    placeholder="Ask about schemes, documents, or eligibility"
                                    aria-label="Message"
                                    className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || input.trim().length < 2}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                                    aria-label="Send message"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
                                Never share Aadhaar, bank, or OTP details here. Eligibility is decided by the issuing department.
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-6"
                aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
                aria-expanded={isOpen}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>
        </>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    isUser && 'bg-primary text-primary-foreground',
                    !isUser && !message.isError && 'bg-secondary text-secondary-foreground',
                    message.isError && 'border border-danger-200 bg-danger-50 text-danger-700'
                )}
            >
                {message.isError && (
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Could not answer
                    </span>
                )}

                <p className="whitespace-pre-wrap">{message.content}</p>

                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2">
                        <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" />
                            Based on
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {message.sources.map((source) =>
                                source.href ? (
                                    <Link
                                        key={source.id}
                                        href={source.href}
                                        className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground transition-colors hover:border-primary hover:text-primary"
                                    >
                                        {source.title}
                                    </Link>
                                ) : (
                                    <span
                                        key={source.id}
                                        className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
                                    >
                                        {source.title}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
