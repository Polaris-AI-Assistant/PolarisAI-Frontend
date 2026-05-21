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
    Mic,
    MicOff,
    Volume2,
    Square,
} from "lucide-react";

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

            textarea.style.height = `${minHeight}px`;

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
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

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
    onStopStreaming?: () => void;
    placeholder?: string;
    disabled?: boolean;
    isStreaming?: boolean;
    showExamples?: boolean;
    examples?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick?: () => void;
    }>;
    onAttachFile?: () => void;
    attachedFiles?: any[];
    isListening?: boolean;
    isVoiceSupported?: boolean;
    onToggleVoice?: () => void;
    audioLevel?: number;
    interimTranscript?: string;
    voiceError?: string | null;
    selectedLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    hasMessages?: boolean;
}

export function VercelV0Chat({
    value: externalValue,
    onChange: externalOnChange,
    onSubmit,
    onStopStreaming,
    placeholder = "Ask me anything...",
    disabled = false,
    isStreaming = false,
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

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: hasMessages ? 24 : 28,
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
        { icon: <ImageIcon className="w-4 h-4" />, label: "Clone a Screenshot" },
        { icon: <Figma className="w-4 h-4" />, label: "Import from Figma" },
        { icon: <FileUp className="w-4 h-4" />, label: "Upload a Project" },
        { icon: <MonitorIcon className="w-4 h-4" />, label: "Landing Page" },
        { icon: <CircleUserRound className="w-4 h-4" />, label: "Sign Up Form" },
    ];

    const displayExamples = examples || defaultExamples;

    return (
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
            <div className="w-full">
                {/* Modern chat input — clean and minimal */}
                <div
                    className="relative w-full rounded-3xl shadow-lg"
                    style={{
                        background: "#303030",
                    }}
                >
                    {/* Single inline row: attach | textarea | voice | send */}
                    <div className="flex items-center gap-3 px-4 py-3 w-full">

                        {/* Left: + / attach button */}
                        {onAttachFile ? (
                            <button
                                type="button"
                                onClick={onAttachFile}
                                disabled={disabled}
                                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 text-neutral-400 hover:text-neutral-200 hover:bg-[#444] hover:bg-opacity-60"
                                title="Attach file"
                            >
                                <Paperclip className="w-[17px] h-[17px]" />
                                {attachedFiles.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center">
                                        {attachedFiles.length}
                                    </span>
                                )}
                            </button>
                        ) : (
                            /* Plus icon when no attach handler */
                            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-[#444] hover:bg-opacity-50 transition-all duration-150 cursor-pointer">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                                </svg>
                            </div>
                        )}

                        {/* Textarea — grows, fills all remaining space */}
                        <div className="flex-1 min-w-0 relative">
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
                                    "w-full resize-none bg-transparent border-none",
                                    "text-white text-sm leading-relaxed",
                                    "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-neutral-500 placeholder:text-sm",
                                    "p-0 m-0 block",
                                    hasMessages ? "min-h-[24px]" : "min-h-[24px]"
                                )}
                                style={{ overflow: "hidden", lineHeight: "1.5rem", verticalAlign: "middle" }}
                                rows={1}
                            />
                            {/* Interim transcript shown below input inline */}
                            {isListening && interimTranscript && (
                                <p className="text-xs text-violet-300/70 italic truncate mt-0.5">
                                    <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1.5 relative top-[-1px]" />
                                    {interimTranscript}
                                </p>
                            )}
                        </div>

                        {/* Right: voice button */}
                        {isVoiceSupported && onToggleVoice && (
                            <div className="relative flex-shrink-0 flex items-center">
                                {isListening && (
                                    <>
                                        <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                                        <span className="absolute inset-0 rounded-full animate-pulse bg-red-500/10" />
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={onToggleVoice}
                                    disabled={disabled}
                                    className={cn(
                                        "relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                                        isListening
                                            ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                                            : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                                    )}
                                    title={isListening ? "Stop recording" : "Start voice input"}
                                >
                                    {isListening ? (
                                        <div className="flex items-end gap-[2px] h-3.5">
                                            {[0, 1, 2, 3].map(i => (
                                                <div
                                                    key={i}
                                                    className="w-[3px] bg-red-400 rounded-full transition-all duration-75"
                                                    style={{
                                                        height: `${Math.max(4, (audioLevel * 14) * (0.4 + Math.sin(Date.now() / 150 + i * 1.5) * 0.3 + 0.3))}px`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <Mic className="w-[17px] h-[17px]" />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Send/Stop button — white background for send, red for stop */}
                        {isStreaming ? (
                            <button
                                type="button"
                                onClick={onStopStreaming}
                                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 bg-neutral-700 hover:bg-neutral-600"
                                title="Stop streaming"
                            >
                                <Square className="w-3.5 h-3.5 text-white fill-white" />
                                <span className="sr-only">Stop streaming</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!value.trim() || disabled}
                                className={cn(
                                    "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95",
                                    value.trim() && !disabled
                                        ? "bg-white hover:bg-gray-200 shadow-md"
                                        : "bg-neutral-700 cursor-not-allowed"
                                )}
                            >
                                <ArrowUpIcon
                                    className={cn(
                                        "w-4 h-4",
                                        value.trim() && !disabled ? "text-black" : "text-neutral-500"
                                    )}
                                />
                                <span className="sr-only">Send</span>
                            </button>
                        )}
                    </div>

                    {/* Voice error toast */}
                    {voiceError && (
                        <div className="mx-3 mb-2.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                            <MicOff className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{voiceError}</span>
                        </div>
                    )}
                </div>

                {/* Example pills */}
                {showExamples && displayExamples.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {displayExamples.map((example, index) => (
                            <ActionButton
                                key={index}
                                icon={example.icon}
                                label={example.label}
                                onClick={"onClick" in example ? example.onClick : undefined}
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-neutral-400 hover:text-neutral-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs hover:bg-[#404040]"
            style={{
                background: "#303030",
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}