# Settings Modal Implementation

## Overview

This document describes the complete implementation of a ChatGPT-style Settings modal for the Polaris AI frontend, with a dedicated Memory Settings tab for controlling the memory features backed by Supabase.

## Architecture

### Frontend Components

#### 1. Settings Context (`contexts/SettingsContext.tsx`)
Global state management for the settings modal using React Context API.

**Features:**
- `isOpen`: Controls modal visibility
- `activeTab`: Tracks current active tab ('general' | 'memory' | 'notifications' | 'account')
- `openSettings(tab?)`: Opens the modal with optional tab selection
- `closeSettings()`: Closes the modal
- `setActiveTab(tab)`: Switches between tabs

#### 2. Settings Modal (`components/settings/SettingsModal.tsx`)
Main modal component with tabbed navigation.

**Features:**
- Full-screen overlay with semi-transparent background
- Centered panel (max-width 800px) with rounded corners
- Sidebar navigation with 4 tabs
- Close via X button, clicking outside, or pressing Escape
- Focus trap and scroll lock when open
- Responsive design (full-screen on mobile)

**Tabs:**
- **General**: Placeholder for general settings
- **Memory**: Full implementation with memory controls
- **Notifications**: Placeholder for notification settings
- **Account**: Shows user email and sign-out button

#### 3. Memory Settings Tab (`components/settings/MemorySettingsTab.tsx`)
Complete implementation of memory preference controls.

**Sections:**

##### Global Memory Toggle
- Master switch to enable/disable memory system
- When disabled, shows notice about existing memories
- Disables category toggles when off

##### Category Toggles
Grid of checkboxes for:
- Forms
- Docs
- Sheets
- Calendar
- Gmail
- Flights
- Other artifacts

##### Auto-delete Options
Radio buttons for automatic memory deletion:
- 24 hours
- 7 days
- 30 days
- 90 days
- Never delete (default)

##### Weekly Digest
- Toggle for enabling weekly email digest
- Day selector (Sunday, Monday, Friday)
- Time picker (24-hour format)
- Displays user email where digest will be sent

##### Danger Zone
Two destructive actions:
- Delete last 30 days
- Delete all memories

Both show confirmation dialogs before proceeding.

**UX Features:**
- Auto-save with 1-second debounce
- Save status indicator (Saving... / Saved / Error)
- Loading state with spinner
- Disabled state styling when memory is turned off
- Confirmation dialogs for destructive actions

#### 4. UI Components

##### Switch (`components/ui/switch.tsx`)
Radix UI-based toggle switch component.

**Props:**
- Standard Radix Switch props
- Custom styling with Tailwind
- Focus and disabled states

### Frontend API Integration

#### Memory Settings Hook (`lib/memorySettings.ts`)

**Interface:**
```typescript
interface MemorySettings {
  enabled: boolean;
  categories: {
    forms: boolean;
    docs: boolean;
    sheets: boolean;
    calendar: boolean;
    gmail: boolean;
    flights: boolean;
    otherArtifacts: boolean;
  };
  autoDeleteDays: 1 | 7 | 30 | 90 | 0;
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: 'sunday' | 'monday' | 'friday';
  weeklyDigestTime: string; // "08:00" format
}
```

**Hook: `useMemorySettings()`**

Returns:
- `settings`: Current settings object
- `isLoading`: Loading state for initial fetch
- `isSaving`: Saving state for updates
- `error`: Error message if any
- `updateSettings(partial)`: Update settings locally
- `saveSettings()`: Save to backend
- `deleteAllMemories()`: Delete all user memories
- `deleteLast30Days()`: Delete last 30 days of memories

**API Calls:**
- `GET /api/settings/memory` - Fetch settings
- `PUT /api/settings/memory` - Update settings
- `DELETE /api/settings/memory/all` - Delete all
- `DELETE /api/settings/memory/last-30-days` - Delete last 30 days

### Frontend API Routes

Next.js API routes that proxy to the backend:

1. `app/api/settings/memory/route.ts`
   - GET: Fetch memory settings
   - PUT: Update memory settings

2. `app/api/settings/memory/all/route.ts`
   - DELETE: Delete all memories

3. `app/api/settings/memory/last-30-days/route.ts`
   - DELETE: Delete last 30 days of memories

All routes:
- Require Bearer token authentication
- Forward requests to backend API
- Handle errors appropriately

### Backend Implementation

#### Memory Settings Controller (`memory/memorySettingsController.js`)

**Endpoints:**

##### GET /api/settings/memory
Fetch user's memory settings.
- Returns default settings if none exist
- Authenticated via JWT middleware

##### PUT /api/settings/memory
Update user's memory settings.
- Validates settings structure
- Uses upsert to create or update
- Returns updated settings

##### DELETE /api/settings/memory/all
Delete all memories for the user.
- Removes all entries from `memories` table
- Requires authentication

##### DELETE /api/settings/memory/last-30-days
Delete memories from last 30 days.
- Calculates 30-day cutoff
- Deletes only recent memories
- Requires authentication

#### Database Schema

**Table: `memory_settings`**

```sql
CREATE TABLE memory_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{...}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

**Features:**
- One settings record per user (enforced by UNIQUE constraint)
- JSONB column for flexible settings storage
- Cascading delete when user is deleted
- Row Level Security (RLS) enabled
- Policies for read, insert, update, delete

**SQL Files:**
- `create_memory_settings_table.sql` - Table creation with RLS
- `disable_memory_settings_rls.sql` - Disable RLS for development

## Integration Points

### Profile Dropdown

Updated `components/kokonutui/profile-dropdown.tsx`:

**Changes:**
- Import `useSettings` hook
- "Settings" menu item now calls `openSettings('general')`
- Closes dropdown when settings is opened

### Root Layout

Updated `app/layout.tsx`:

**Changes:**
- Wrap app with `SettingsProvider`
- Render `<SettingsModal />` at root level
- Modal is controlled globally via context

## File Structure

```
PolarisAI-Frontend/
├── app/
│   ├── api/
│   │   └── settings/
│   │       └── memory/
│   │           ├── route.ts
│   │           ├── all/
│   │           │   └── route.ts
│   │           └── last-30-days/
│   │               └── route.ts
│   └── layout.tsx (updated)
├── components/
│   ├── kokonutui/
│   │   └── profile-dropdown.tsx (updated)
│   ├── settings/
│   │   ├── SettingsModal.tsx
│   │   └── MemorySettingsTab.tsx
│   └── ui/
│       └── switch.tsx (new)
├── contexts/
│   └── SettingsContext.tsx
├── lib/
│   ├── memorySettings.ts
│   └── stores/
│       └── settingsStore.ts

PolarisAI-Backend/
├── memory/
│   ├── memorySettingsController.js
│   ├── create_memory_settings_table.sql
│   └── disable_memory_settings_rls.sql
└── index.js (updated)
```

## Setup Instructions

### Frontend

1. **Install Dependencies**
   ```bash
   cd PolarisAI-Frontend
   npm install @radix-ui/react-switch
   ```

2. **Environment Variables**
   Ensure `NEXT_PUBLIC_API_URL` is set to your backend URL.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### Backend

1. **Create Database Table**
   Run the SQL in Supabase dashboard:
   ```bash
   # Execute: memory/create_memory_settings_table.sql
   ```

2. **For Development (Optional)**
   Disable RLS for easier testing:
   ```bash
   # Execute: memory/disable_memory_settings_rls.sql
   ```

3. **Start Backend Server**
   ```bash
   cd PolarisAI-Backend
   npm start
   ```

## Usage

1. **Open Settings**
   - Click on profile dropdown in sidebar
   - Click "Settings"
   - Modal opens to General tab

2. **Navigate to Memory Tab**
   - Click "Memory" in sidebar
   - View and edit memory preferences

3. **Configure Memory**
   - Toggle global memory on/off
   - Select which categories to remember
   - Set auto-delete period
   - Configure weekly digest
   - Use danger zone for deletions

4. **Changes Auto-Save**
   - Settings save automatically after 1 second
   - Watch for "Saved" indicator

## Design Patterns

### State Management
- React Context for global modal state
- Local state in components for UI state
- Custom hooks for data fetching

### Styling
- Tailwind CSS utility classes
- Dark theme (zinc color palette)
- Consistent spacing and sizing
- Responsive design with breakpoints

### Error Handling
- Try-catch blocks in async operations
- User-friendly error messages
- Loading and error states in UI
- Fallback to defaults on fetch errors

### Accessibility
- Focus trap in modal
- Keyboard navigation (Escape to close)
- ARIA labels on interactive elements
- Proper form labels and associations

## Future Enhancements

### Planned Features

1. **Weekly Digest Email System**
   - Background job to send digests
   - Email template design
   - Unsubscribe functionality

2. **Auto-delete Cron Job**
   - Scheduled cleanup based on user settings
   - Notification before deletion

3. **General Settings Tab**
   - Theme preferences
   - Language selection
   - Default model selection

4. **Notifications Tab**
   - Push notification preferences
   - Email notification settings
   - In-app notification controls

5. **Account Tab**
   - Profile editing
   - Password change
   - Account deletion
   - Usage statistics

### Technical Improvements

1. **Optimistic Updates**
   - Update UI immediately, revert on error
   - Better perceived performance

2. **Batch Operations**
   - Debounced save improvements
   - Reduce API calls

3. **Settings Export/Import**
   - Download settings as JSON
   - Import settings from file

4. **Memory Analytics**
   - Show memory usage statistics
   - Visualize category breakdown
   - Activity timeline

## Testing

### Manual Testing Checklist

- [ ] Open settings from profile dropdown
- [ ] Switch between all tabs
- [ ] Toggle memory on/off (verify categories disable)
- [ ] Change each category checkbox
- [ ] Select each auto-delete option
- [ ] Enable weekly digest and configure
- [ ] Delete last 30 days (with confirmation)
- [ ] Delete all memories (with confirmation)
- [ ] Close modal via X button
- [ ] Close modal via clicking outside
- [ ] Close modal via Escape key
- [ ] Test on mobile viewport
- [ ] Verify auto-save works
- [ ] Check settings persist on page reload

### API Testing

Test with curl or Postman:

```bash
# Get settings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/settings/memory

# Update settings
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"settings": {...}}' \
  http://localhost:3000/api/settings/memory

# Delete all
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/settings/memory/all
```

## Troubleshooting

### Common Issues

**Settings not saving:**
- Check browser console for errors
- Verify backend is running
- Check authentication token is valid

**Modal not opening:**
- Ensure SettingsProvider wraps app
- Check console for React errors
- Verify profile dropdown integration

**Database errors:**
- Run SQL schema creation script
- Check RLS policies if using Supabase Auth
- Verify user_id exists in auth.users

**API 401 errors:**
- Token may be expired
- Refresh and try again
- Check middleware configuration

## Support

For issues or questions:
1. Check this documentation
2. Review console errors
3. Check backend logs
4. Verify API endpoints are registered in index.js

## License

Part of the Polaris AI project.
