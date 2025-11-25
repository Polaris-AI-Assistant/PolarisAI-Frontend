# Chat History System Documentation

## Overview

The Main Agent now features a comprehensive chat history system similar to ChatGPT, allowing users to:
- Create new chat sessions automatically on each visit
- View and manage previous conversations in a sidebar
- Organize chats by time periods (Today, Yesterday, Last 7 days, etc.)
- Rename and delete individual chats
- Seamlessly switch between different chat sessions

## Features

### 1. **Automatic New Chat Creation**
- Every time a user visits `/agent` without a `chatId` parameter, a new chat session is automatically created
- Each chat gets a unique ID and starts with an empty conversation
- The URL is automatically updated to include the chat ID: `/agent?chatId=chat_1234567890_abc123`

### 2. **Chat History Sidebar**
- **Collapsible sidebar** on the left side showing all previous chats
- **Grouped by time periods:**
  - Today
  - Yesterday
  - Previous 7 Days
  - Previous 30 Days
  - Older
- **New Chat button** at the top of the sidebar for quick access

### 3. **Chat Management**
- **View:** Click any chat in the sidebar to load that conversation
- **Rename:** Hover over a chat and click the edit icon to rename it
- **Delete:** Hover over a chat and click the trash icon to delete it
- **Auto-naming:** Chats are automatically named based on the first user message

### 4. **Data Storage**
- All chats are stored in **localStorage** under the key `mainAgent_chatSessions`
- Each chat session contains:
  - Unique ID
  - Title (auto-generated or custom)
  - Creation timestamp
  - Last updated timestamp
  - Array of messages (with full metadata)
  - Message count

### 5. **Migration Support**
- Automatically migrates old conversation data from the previous single-conversation system
- Old data from `mainAgent_conversation` is converted to a new chat session
- Migration happens once automatically on first load

## Technical Implementation

### File Structure

```
frontend/
├── lib/
│   └── chatHistory.ts          # Chat history management library
└── app/
    └── agent/
        └── page.tsx            # Main agent page with sidebar UI
```

### Key Functions (chatHistory.ts)

#### Session Management
- `createNewChatSession()` - Creates a new empty chat session
- `getChatSession(chatId)` - Retrieves a specific chat by ID
- `getAllChatSessions()` - Gets all chat sessions sorted by update time
- `updateChatSession(chatId, messages)` - Updates a chat with new messages
- `deleteChatSession(chatId)` - Deletes a chat session
- `renameChatSession(chatId, title)` - Renames a chat session

#### Utility Functions
- `generateChatId()` - Generates unique chat IDs
- `generateChatTitle(firstMessage)` - Auto-generates titles from first message
- `getGroupedChatSessions()` - Groups chats by time periods
- `migrateOldConversation()` - Migrates old single-conversation data

### Data Structures

#### ChatSession Interface
```typescript
interface ChatSession {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  messages: ChatMessage[];       // Array of messages
  messageCount: number;          // Total message count
}
```

#### ChatMessage Interface
```typescript
interface ChatMessage {
  id: string;                    // Unique message ID
  role: 'user' | 'assistant';    // Message sender
  content: string;               // Message text
  timestamp: Date;               // When sent
  agentsUsed?: string[];         // Which agents processed this
  processingTime?: string;       // How long it took
  isError?: boolean;             // Error indicator
}
```

## User Interface

### Sidebar Layout
```
┌─────────────────────────┐
│ [+] New Chat            │  <- Header with new chat button
├─────────────────────────┤
│ TODAY                   │  <- Time group
│ 💬 Schedule meeting...  │  <- Chat item with hover actions
│ 💬 Create document...   │
│                         │
│ YESTERDAY               │
│ 💬 Check repositories.. │
│                         │
│ PREVIOUS 7 DAYS         │
│ 💬 Analyze data...      │
├─────────────────────────┤
│ [🏠] Back to Dashboard  │  <- Footer
└─────────────────────────┘
```

### Chat Item Actions
- **Rename:** Inline editing with save/cancel buttons
- **Delete:** Confirmation dialog before deletion
- **Hover state:** Shows edit and delete icons

### Responsive Design
- Sidebar can be toggled with hamburger menu
- Collapses to width: 0 when closed
- Smooth transitions for opening/closing

## Usage Examples

### Creating a New Chat
```typescript
// Automatic on page load
const newSession = createNewChatSession();
setCurrentChatId(newSession.id);
window.history.replaceState({}, '', `/agent?chatId=${newSession.id}`);
```

### Loading an Existing Chat
```typescript
// From URL parameter
const chatId = searchParams.get('chatId');
const session = getChatSession(chatId);
if (session) {
  setMessages(session.messages);
}
```

### Updating a Chat
```typescript
// After sending/receiving messages
updateChatSession(currentChatId, messages);
```

### Managing Chats
```typescript
// Rename
renameChatSession(chatId, 'My Important Chat');

// Delete
deleteChatSession(chatId);

// Group by time
const grouped = getGroupedChatSessions();
// Returns: { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] }
```

## Benefits

1. **Better Organization:** Users can manage multiple conversations separately
2. **Context Preservation:** Each chat maintains its own context and history
3. **Easy Navigation:** Quick access to all previous conversations
4. **Familiar UX:** Similar to popular chat interfaces like ChatGPT
5. **No Data Loss:** All conversations are preserved in localStorage
6. **Seamless Migration:** Old data is automatically converted to the new system

## Browser Compatibility

- Works in all modern browsers with localStorage support
- Gracefully handles cases where localStorage is unavailable
- Data persists across browser sessions

## Future Enhancements

Potential improvements for future versions:
1. **Backend Sync:** Store chats in database for multi-device access
2. **Search:** Search across all chat histories
3. **Export:** Export chats as JSON/PDF
4. **Tags/Categories:** Organize chats with custom tags
5. **Share:** Share chat sessions with team members
6. **Archive:** Archive old chats instead of deleting
7. **Favorites:** Pin important chats to the top

## Troubleshooting

### Chat not loading
- Check browser console for errors
- Verify localStorage is not full
- Clear browser cache if needed

### Lost chat history
- Check if localStorage was cleared
- Look for migrated data in new format
- Consider implementing cloud backup

### Performance issues with many chats
- Consider pagination for large chat lists
- Implement virtual scrolling for sidebar
- Add chat archiving feature

## Migration Notes

The system automatically detects and migrates data from the old single-conversation system:
- Old key: `mainAgent_conversation`
- New key: `mainAgent_chatSessions`
- Migration happens once on first load
- Old data is removed after successful migration

## API Reference

See `frontend/lib/chatHistory.ts` for complete API documentation.
