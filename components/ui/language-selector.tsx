"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, LANGUAGE_GROUPS, getLanguageFlag } from "@/hooks/useVoiceInput";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  disabled?: boolean;
  compact?: boolean; // Compact mode shows only flag + code
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  compact = true,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("Popular");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
  const shortCode = selectedLanguage.split("-")[0].toUpperCase();

  // Filter languages by search
  const filteredLanguages = searchQuery
    ? SUPPORTED_LANGUAGES.filter(
        (l) =>
          l.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Get languages for active group
  const groupLanguages = !searchQuery
    ? LANGUAGE_GROUPS[activeGroup as keyof typeof LANGUAGE_GROUPS]?.map(code =>
        SUPPORTED_LANGUAGES.find(l => l.code === code)
      ).filter(Boolean)
    : null;

  const handleSelect = useCallback((code: string) => {
    onLanguageChange(code);
    setIsOpen(false);
    setSearchQuery("");
  }, [onLanguageChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1 rounded-lg transition-colors",
          compact
            ? "px-2 py-1.5 text-xs hover:bg-neutral-800 border border-transparent hover:border-neutral-700"
            : "px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "bg-neutral-800 border-neutral-700"
        )}
        title={`Voice language: ${selectedLang?.label || selectedLanguage}`}
      >
        <Globe className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-300 font-medium">{shortCode}</span>
        <ChevronDown className={cn(
          "w-3 h-3 text-zinc-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Search */}
          <div className="p-2 border-b border-neutral-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {/* Group Tabs (hidden when searching) */}
          {!searchQuery && (
            <div className="flex overflow-x-auto gap-0.5 p-1.5 border-b border-neutral-800 scrollbar-none">
              {Object.keys(LANGUAGE_GROUPS).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors",
                    activeGroup === group
                      ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                      : "text-zinc-400 hover:bg-neutral-800 hover:text-zinc-300"
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          )}

          {/* Language List */}
          <div className="max-h-52 overflow-y-auto p-1.5">
            {(filteredLanguages || groupLanguages || []).map((lang) => {
              if (!lang) return null;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left",
                    selectedLanguage === lang.code
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                      : "text-zinc-300 hover:bg-neutral-800"
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1 truncate">{lang.label}</span>
                  <span className="text-xs text-zinc-500">{lang.code}</span>
                  {selectedLanguage === lang.code && (
                    <span className="text-violet-400">✓</span>
                  )}
                </button>
              );
            })}
            {searchQuery && filteredLanguages?.length === 0 && (
              <p className="text-center text-zinc-500 text-xs py-4">
                No languages found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
