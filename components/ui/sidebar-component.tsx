"use client";

import React, { useState, useEffect, useRef } from "react";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { getStoredUser } from "@/lib/auth";
import Image from "next/image";
import {
  Search as SearchIcon,
  Dashboard,
  Task,
  Folder,
  Calendar as CalendarIcon,
  UserMultiple,
  Analytics,
  DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,
  AddLarge,
  Filter,
  Time,
  InProgress,
  CheckmarkOutline,
  Flag,
  Archive,
  View,
  Report,
  StarFilled,
  Group,
  ChartBar,
  FolderOpen,
  Share,
  CloudUpload,
  Security,
  Notification,
  Integration,
  TrashCan,
  Menu,
  Close,
  SidePanelOpen,
  SidePanelClose,
} from "@carbon/icons-react";

/** ======================= Local SVG paths (inline) ======================= */
const svgPaths = {
  p10dcabc0: "M8 11L3 6.00001L3.7 5.30001L8 9.60001L12.3 5.30001L13 6.00001L8 11Z",
  p36880f80:
    "M0.32 0C0.20799 0 0.151984 0 0.109202 0.0217987C0.0715695 0.0409734 0.0409734 0.0715695 0.0217987 0.109202C0 0.151984 0 0.20799 0 0.32V6.68C0 6.79201 0 6.84801 0.0217987 6.8908C0.0409734 6.92843 0.0715695 6.95902 0.109202 6.9782C0.151984 7 0.207989 7 0.32 7L3.68 7C3.79201 7 3.84802 7 3.8908 6.9782C3.92843 6.95903 3.95903 6.92843 3.9782 6.8908C4 6.84801 4 6.79201 4 6.68V4.32C4 4.20799 4 4.15198 4.0218 4.1092C4.04097 4.07157 4.07157 4.04097 4.1092 4.0218C4.15198 4 4.20799 4 4.32 4L19.68 4C19.792 4 19.848 4 19.8908 4.0218C19.9284 4.04097 19.959 4.07157 19.9782 4.1092C20 4.15198 20 4.20799 20 4.32V6.68C20 6.79201 20 6.84802 20.0218 6.8908C20.041 6.92843 20.0716 6.95903 20.1092 6.9782C20.152 7 20.208 7 20.32 7L23.68 7C23.792 7 23.848 7 23.8908 6.9782C23.9284 6.95903 23.959 6.92843 23.9782 6.8908C24 6.84802 24 6.79201 24 6.68V0.32C24 0.20799 24 0.151984 23.9782 0.109202C23.959 0.0715695 23.9284 0.0409734 23.8908 0.0217987C23.848 0 23.792 0 23.68 0H0.32Z",
  p355df480:
    "M0.32 16C0.20799 16 0.151984 16 0.109202 15.9782C0.0715695 15.959 0.0409734 15.9284 0.0217987 15.8908C0 15.848 0 15.792 0 15.68V9.32C0 9.20799 0 9.15198 0.0217987 9.1092C0.0409734 9.07157 0.0715695 9.04097 0.109202 9.0218C0.151984 9 0.207989 9 0.32 9H3.68C3.79201 9 3.84802 9 3.8908 9.0218C3.92843 9.04097 3.95903 9.07157 3.9782 9.1092C4 9.15198 4 9.20799 4 9.32V11.68C4 11.792 4 11.848 4.0218 11.8908C4.04097 11.9284 4.07157 11.959 4.1092 11.9782C4.15198 12 4.20799 12 4.32 12L19.68 12C19.792 12 19.848 12 19.8908 11.9782C19.9284 11.959 19.959 11.9284 19.9782 11.8908C20 11.848 20 11.792 20 11.68V9.32C20 9.20799 20 9.15199 20.0218 9.1092C20.041 9.07157 20.0716 9.04098 20.1092 9.0218C20.152 9 20.208 9 20.32 9H23.68C23.792 9 23.848 9 23.8908 9.0218C23.9284 9.04098 23.959 9.07157 23.9782 9.1092C24 9.15199 24 9.20799 24 9.32V15.68C24 15.792 24 15.848 23.9782 15.8908C23.959 15.9284 23.9284 15.959 23.8908 15.9782C23.848 16 23.792 16 23.68 16H0.32Z",
  pfa0d600:
    "M6.32 10C6.20799 10 6.15198 10 6.1092 9.9782C6.07157 9.95903 6.04097 9.92843 6.0218 9.8908C6 9.84802 6 9.79201 6 9.68V6.32C6 6.20799 6 6.15198 6.0218 6.1092C6.04097 6.07157 6.07157 6.04097 6.1092 6.0218C6.15198 6 6.20799 6 6.32 6L17.68 6C17.792 6 17.848 6 17.8908 6.0218C17.9284 6.04097 17.959 6.07157 17.9782 6.1092C18 6.15198 18 6.20799 18 6.32V9.68C18 9.79201 18 9.84802 17.9782 9.8908C17.959 9.92843 17.9284 9.95903 17.8908 9.9782C17.848 10 17.792 10 17.68 10H6.32Z",
};

/* ----------------------------- Brand / Logos ----------------------------- */

function AvatarCircle() {
  return (
    <div className="relative rounded-full shrink-0 size-8 bg-black">
      <div className="flex items-center justify-center size-8">
        <UserIcon size={16} className="text-neutral-50" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-neutral-800 pointer-events-none"
      />
    </div>
  );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-black h-10 relative rounded-lg flex items-center w-full">
        <div className="flex items-center justify-center shrink-0 px-1">
          <div className="size-8 flex items-center justify-center">
            <SearchIcon size={16} className="text-neutral-50" />
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div className="flex flex-col justify-center size-full">
            <div className="flex flex-col gap-2 items-start justify-center pr-2 py-1 w-full">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] text-neutral-50 placeholder:text-neutral-400 leading-[20px]"
              />
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-lg border border-neutral-800 pointer-events-none"
        />
      </div>
    </div>
  );
}

/* --------------------------- Types / Content Map -------------------------- */

interface MenuItemT {
  icon?: React.ReactNode;
  label: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  children?: MenuItemT[];
  onClick?: () => void;
  chatId?: string;
  onDelete?: (id: string) => void;
}
interface MenuSectionT {
  title: string;
  items: MenuItemT[];
}
interface SidebarContent {
  title: string;
  sections: MenuSectionT[];
}

function getSidebarContent(
  activeSection: string,
  chats: any[],
  currentChatId: string | null,
  onChatSelect: (id: string) => void,
  onNewChat: () => void,
  onDeleteChat: (id: string) => void
): SidebarContent {
  const chatsWithMessages = chats.filter((chat) => chat.messageCount >= 1);
  const chatItems: MenuItemT[] = chatsWithMessages.slice(0, 10).map((chat) => ({
    icon: <Time size={16} className="text-neutral-50" />,
    label: chat.title || "New conversation",
    isActive: chat.id === currentChatId,
    onClick: () => onChatSelect(chat.id),
    chatId: chat.id,
    onDelete: onDeleteChat,
  }));

  return {
    title: "Chat History",
    sections: [
      {
        title: "Actions",
        items: [
          {
            icon: <AddLarge size={16} className="text-neutral-50" />,
            label: "New chat",
            onClick: onNewChat,
          },
        ],
      },
      {
        title: "Recent Chats",
        items:
          chatItems.length > 0
            ? chatItems
            : [
                {
                  icon: <Time size={16} className="text-neutral-400" />,
                  label: "No chats yet",
                },
              ],
      },
    ],
  };
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
  children,
  label,
  isActive = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center justify-center rounded-lg p-3 min-w-[72px] transition-colors duration-300
        ${isActive ? "bg-neutral-800 text-neutral-50" : "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"}`}
      onClick={onClick}
    >
      <div className="mb-1">{children}</div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
  onDashboardClick,
  onVaultClick,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onDashboardClick?: () => void;
  onVaultClick?: () => void;
}) {
  return (
    <aside className="bg-neutral-900 flex flex-col gap-3 items-center p-4 w-24 h-screen">
      {/* Logo */}
      <div className="mb-3 w-full flex flex-col items-center">
        <div className="size-10 mb-2">
          <Image src="/polaris.png" alt="Polaris AI" width={60} height={60} className="object-contain" />
        </div>
        <span className="text-[22px] text-neutral-50 font-bold tracking-wide">Polaris AI</span>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-3 w-full items-center">
        <IconNavButton
          label="Chats"
          isActive={activeSection === "chats"}
          onClick={() => onSectionChange("chats")}
        >
          <Task size={24} />
        </IconNavButton>
        <IconNavButton label="Apps" onClick={onDashboardClick}>
          <Dashboard size={24} />
        </IconNavButton>
        <IconNavButton label="Vault" onClick={onVaultClick}>
          <FolderOpen size={24} />
        </IconNavButton>
      </div>

      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-3 w-full items-center">
        <IconNavButton
          label="Settings"
          isActive={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
        >
          <SettingsIcon size={24} />
        </IconNavButton>
        <div className="size-10 mt-2">
          <AvatarCircle />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */

interface DetailSidebarProps {
  activeSection: string;
  chats: any[];
  currentChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Mobile-only: called when a chat is selected so the drawer closes */
  onMobileClose?: () => void;
}

function DetailSidebar({
  activeSection,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
  onMobileClose,
}: DetailSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  const content = getSidebarContent(
    activeSection,
    chats,
    currentChatId,
    (id) => {
      onChatSelect(id);
      onMobileClose?.();
    },
    () => {
      onNewChat();
      onMobileClose?.();
    },
    onDeleteChat
  );

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || user.email.split("@")[0];
      setUserData({
        name: fullName,
        email: user.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
      });
    }
  }, []);

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  if (isCollapsed) return null;

  return (
    <aside className="bg-[#181818] flex flex-col gap-4 items-start p-4 w-80 h-screen overflow-hidden">
      {/* Header row: title + collapse button */}
      <div className="w-full flex items-center justify-between">
        <div className="font-semibold text-[18px] text-neutral-50 leading-[27px] px-2">
          {content.title}
        </div>
        {/* Desktop-only collapse button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center rounded-lg size-9 transition-colors duration-200 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <SidePanelClose size={20} />
        </button>
      </div>

      <SearchContainer />

      <div className="flex-1 flex flex-col gap-4 w-full overflow-y-auto items-start">
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </div>

      {/* Profile Dropdown at bottom */}
      <div className="w-full pt-2 border-t border-neutral-800">
        <ProfileDropdown
          data={{
            name: userData?.name || "User",
            email: userData?.email || "user@example.com",
            avatar: userData?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
            subscription: "Free",
            model: "Main Agent",
          }}
        />
      </div>
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
}: {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else if (item.onClick) item.onClick();
    else onItemClick?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.chatId && item.onDelete) item.onDelete(item.chatId);
  };

  return (
    <div className="relative shrink-0 w-full group">
      <div
        className={`rounded-lg cursor-pointer transition-colors duration-300 flex items-center relative w-full h-10 px-4 py-2 ${
          item.isActive ? "bg-neutral-800" : "hover:bg-neutral-800"
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center shrink-0">{item.icon}</div>
        <div className="flex-1 relative overflow-hidden ml-3">
          <div className="text-[14px] text-neutral-50 leading-[20px] truncate">{item.label}</div>
        </div>
        {item.chatId && item.onDelete && (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-400"
            aria-label="Delete chat"
          >
            <TrashCan size={16} className="text-neutral-400 hover:text-red-400" />
          </button>
        )}
        {item.hasDropdown && (
          <div className="flex items-center justify-center shrink-0 ml-2">
            <ChevronDownIcon
              size={16}
              className="text-neutral-50 transition-transform duration-300"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
}: {
  section: MenuSectionT;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="relative shrink-0 w-full h-10 overflow-hidden">
        <div className="flex items-center h-10 px-4">
          <div className="text-[14px] text-neutral-400">{section.title}</div>
        </div>
      </div>
      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => console.log(`Clicked ${item.label}`)}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── Mobile Bottom Nav Bar ─────────────────── */

function MobileBottomNav({
  activeSection,
  onSectionChange,
  onDashboardClick,
  onVaultClick,
  onMenuOpen,
}: {
  activeSection: string;
  onSectionChange: (s: string) => void;
  onDashboardClick?: () => void;
  onVaultClick?: () => void;
  onMenuOpen: () => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-2 h-16 md:hidden gap-1">
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-50 transition-colors py-2 px-1 rounded-lg hover:bg-neutral-800"
      >
        <Menu size={20} />
        <span className="text-[10px] font-medium">Chats</span>
      </button>
      <button
        type="button"
        onClick={onDashboardClick}
        className="flex-1 flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-50 transition-colors py-2 px-1 rounded-lg hover:bg-neutral-800"
      >
        <Dashboard size={20} />
        <span className="text-[10px] font-medium">Apps</span>
      </button>
      <button
        type="button"
        onClick={onVaultClick}
        className="flex-1 flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-50 transition-colors py-2 px-1 rounded-lg hover:bg-neutral-800"
      >
        <FolderOpen size={20} />
        <span className="text-[10px] font-medium">Vault</span>
      </button>
      <button
        type="button"
        onClick={() => onSectionChange("settings")}
        className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors ${
          activeSection === "settings"
            ? "text-neutral-50 bg-neutral-800"
            : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
        }`}
      >
        <SettingsIcon size={20} />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </nav>
  );
}

/* ─────────────────── Mobile Drawer Overlay ─────────────────── */

function MobileDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[#181818] transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button overlapping top-right of drawer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-lg size-9 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-50 transition-colors"
          aria-label="Close menu"
        >
          <Close size={18} />
        </button>
        {children}
      </div>
    </>
  );
}

/* --------------------------------- Layout -------------------------------- */

interface TwoLevelSidebarProps {
  chats: any[];
  currentChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onDashboardClick?: () => void;
  onVaultClick?: () => void;
  hideIconNav?: boolean;
}

export function TwoLevelSidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onDashboardClick,
  onVaultClick,
  hideIconNav = false,
}: TwoLevelSidebarProps) {
  const [activeSection, setActiveSection] = useState("chats");
  // Desktop: is the detail panel collapsed?
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(false);
  // Mobile: is the drawer open?
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <>
      {/* ── DESKTOP LAYOUT (md+) ─────────────────────────────── */}
      <div className="hidden md:flex flex-row relative h-screen">
        {!hideIconNav && (
          <IconNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onDashboardClick={onDashboardClick}
            onVaultClick={onVaultClick}
          />
        )}

        <DetailSidebar
          activeSection={activeSection}
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
          isCollapsed={isDetailCollapsed}
          onToggleCollapse={() => setIsDetailCollapsed(true)}
        />

        {/* Floating "expand" button — appears when detail panel is collapsed */}
        {isDetailCollapsed && (
          <button
            type="button"
            onClick={() => setIsDetailCollapsed(false)}
            className="absolute top-4 left-2 z-50 flex items-center justify-center rounded-lg size-9 transition-colors duration-200 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <SidePanelOpen size={20} />
          </button>
        )}
      </div>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      {/* Bottom nav bar always visible on mobile */}
      <div className="md:hidden">
        <MobileBottomNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onDashboardClick={onDashboardClick}
          onVaultClick={onVaultClick}
          onMenuOpen={() => setIsMobileDrawerOpen(true)}
        />
      </div>

      {/* Slide-in drawer for chat history on mobile */}
      {/* Visible only on mobile (< md) */}
      <div className="md:hidden">
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        >
          <DetailSidebar
            activeSection={activeSection}
            chats={chats}
            currentChatId={currentChatId}
            onChatSelect={onChatSelect}
            onNewChat={onNewChat}
            onDeleteChat={onDeleteChat}
            isCollapsed={false}
            onToggleCollapse={() => setIsMobileDrawerOpen(false)}
            onMobileClose={() => setIsMobileDrawerOpen(false)}
          />
        </MobileDrawer>
      </div>
    </>
  );
}

export default TwoLevelSidebar;