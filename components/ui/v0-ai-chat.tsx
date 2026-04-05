"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    Mic,
    MicOff,
    Volume2,
    Square,
} from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface VercelV0ChatProps {
    value?: string;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    showExamples?: boolean;
    examples?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick?: () => void;
    }>;
    onAttachFile?: () => void;
    attachedFiles?: any[];
    // Voice input props
    isListening?: boolean;
    isVoiceSupported?: boolean;
    onToggleVoice?: () => void;
    audioLevel?: number;
    interimTranscript?: string;
    voiceError?: string | null;
    // Language props
    selectedLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    // Compact mode (smaller input after first message)
    hasMessages?: boolean;
}

export function VercelV0Chat({
    value: externalValue,
    onChange: externalOnChange,
    onSubmit,
    placeholder = "Ask me anything...",
    disabled = false,
    showExamples = true,
    examples,
    onAttachFile,
    attachedFiles = [],
    isListening = false,
    isVoiceSupported = false,
    onToggleVoice,
    audioLevel = 0,
    interimTranscript = "",
    voiceError = null,
    selectedLanguage = "en-US",
    onLanguageChange,
    hasMessages = false,
}: VercelV0ChatProps) {
    const [internalValue, setInternalValue] = useState("");
    const value = externalValue !== undefined ? externalValue : internalValue;
    const setValue = externalOnChange || setInternalValue;
    
    // Use smaller height when there are messages
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: hasMessages ? 48 : 60,
        maxHeight: hasMessages ? 120 : 200,
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSubmit?.(value.trim());
                setValue("");
                adjustHeight(true);
            }
        }
    };

    const handleSubmit = () => {
        if (value.trim() && !disabled) {
            onSubmit?.(value.trim());
            setValue("");
            adjustHeight(true);
        }
    };

    const defaultExamples = [
        {
            icon: <ImageIcon className="w-4 h-4" />,
            label: "Clone a Screenshot",
        },
        {
            icon: <Figma className="w-4 h-4" />,
            label: "Import from Figma",
        },
        {
            icon: <FileUp className="w-4 h-4" />,
            label: "Upload a Project",
        },
        {
            icon: <MonitorIcon className="w-4 h-4" />,
            label: "Landing Page",
        },
        {
            icon: <CircleUserRound className="w-4 h-4" />,
            label: "Sign Up Form",
        },
    ];

    const displayExamples = examples || defaultExamples;

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6">
            <div className="w-full">
                <div className="relative bg-neutral-900 rounded-xl border border-neutral-800">
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-white text-sm",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-sm",
                                hasMessages ? "min-h-[48px]" : "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                            {onAttachFile && (
                                <button
                                    type="button"
                                    onClick={onAttachFile}
                                    className="group p-2 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                                    disabled={disabled}
                                >
                                    <Paperclip className="w-4 h-4 text-white" />
                                    <span className="text-xs text-zinc-400 hidden group-hover:inline transition-opacity">
                                        Attach {attachedFiles.length > 0 && `(${attachedFiles.length})`}
                                    </span>
                                </button>
                            )}

                            {/* Language Selector */}
                            {onLanguageChange && (
                                <LanguageSelector
                                    selectedLanguage={selectedLanguage}
                                    onLanguageChange={onLanguageChange}
                                    disabled={disabled || isListening}
                                    compact
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Voice Input Button */}
                            {isVoiceSupported && onToggleVoice && (
                                <div className="relative flex items-center">
                                    {/* Pulsing ring animation when listening */}
                                    {isListening && (
                                        <>
                                            <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/20" />
                                            <span className="absolute inset-0 rounded-lg animate-pulse bg-red-500/10" />
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onToggleVoice}
                                        disabled={disabled}
                                        className={cn(
                                            "relative z-10 p-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-1.5",
                                            isListening
                                                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                                                : "text-zinc-400 hover:bg-neutral-800 hover:text-white border border-transparent hover:border-neutral-700"
                                        )}
                                        title={isListening ? "Stop recording" : "Start voice input"}
                                    >
                                        {isListening ? (
                                            <>
                                                {/* Audio level bars */}
                                                <div className="flex items-end gap-[2px] h-4 mr-0.5">
                                                    {[0, 1, 2, 3].map(i => (
                                                        <div
                                                            key={i}
                                                            className="w-[3px] bg-red-400 rounded-full transition-all duration-75"
                                                            style={{
                                                                height: `${Math.max(4, (audioLevel * 16) * (0.4 + Math.sin(Date.now() / 150 + i * 1.5) * 0.3 + 0.3))}px`,
                                                                animationDelay: `${i * 100}ms`,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <Square className="w-3.5 h-3.5 fill-current" />
                                            </>
                                        ) : (
                                            <Mic className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                className="px-2 py-1 rounded-lg text-sm text-zinc-400 transition-colors border border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1"
                                disabled={disabled}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Project
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!value.trim() || disabled}
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1",
                                    value.trim() && !disabled
                                        ? "bg-white text-black hover:bg-gray-100"
                                        : "text-zinc-400 cursor-not-allowed"
                                )}
                            >
                                <ArrowUpIcon
                                    className={cn(
                                        "w-4 h-4",
                                        value.trim() && !disabled
                                            ? "text-black"
                                            : "text-zinc-400"
                                    )}
                                />
                                <span className="sr-only">Send</span>
                            </button>
                        </div>
                    </div>

                    {/* Voice Error Toast */}
                    {voiceError && (
                        <div className="mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                            <MicOff className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{voiceError}</span>
                        </div>
                    )}

                    {/* Interim transcript preview */}
                    {isListening && interimTranscript && (
                        <div className="mx-3 mb-2 px-3 py-1.5 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                            <p className="text-xs text-violet-300/70 italic truncate">
                                <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1.5 relative top-[-1px]" />
                                {interimTranscript}
                            </p>
                        </div>
                    )}
                </div>

                {showExamples && displayExamples.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        {displayExamples.map((example, index) => (
                            <ActionButton
                                key={index}
                                icon={example.icon}
                                label={example.label}
                                onClick={'onClick' in example ? example.onClick : undefined}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {icon}
            <span className="text-xs">{label}</span>
        </button>
    );
}
