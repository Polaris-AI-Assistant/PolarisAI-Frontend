# Streaming Code Response Flicker Fix

## Problem
When the AI generates code responses, the UI was flickering significantly during streaming. This was caused by:

1. **Unnecessary Re-renders**: Every streaming chunk triggered a full re-render of the entire message component
2. **Code Block Re-highlighting**: Syntax highlighting was being re-applied on every chunk, causing visual flicker
3. **No Streaming Awareness**: Components didn't know when content was actively streaming vs. complete

## Solution

### 1. Added Streaming Awareness to MarkdownContent

**File**: `PolarisAI-Frontend/components/ui/MarkdownContent.tsx`

```typescript
interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean; // NEW: Indicates if content is actively streaming
}
```

**Changes**:
- Added `isStreaming` prop to track streaming state
- Pass `isStreaming` to `CodeBlockShiki` component
- Implemented custom comparison function in `React.memo` to prevent unnecessary re-renders

```typescript
const MarkdownContent = memo(function MarkdownContent({ content, isStreaming = false }: MarkdownContentProps) {
  // ... component code
}, (prevProps, nextProps) => {
  // Only re-render if content or streaming status actually changed
  return prevProps.content === nextProps.content && 
         prevProps.isStreaming === nextProps.isStreaming;
});
```

### 2. Updated MainAgentContent to Pass Streaming State

**File**: `PolarisAI-Frontend/components/MainAgentContent.tsx`

```typescript
<MarkdownContent 
  content={message.content} 
  isStreaming={message.id === streamingMessageId}
/>
```

**How it works**:
- `streamingMessageId` tracks which message is currently being streamed
- When a message ID matches `streamingMessageId`, it's marked as streaming
- Once streaming completes, `streamingMessageId` is set to `null`

### 3. CodeBlockShiki Already Handles Streaming

**File**: `PolarisAI-Frontend/components/ui/CodeBlockShiki.tsx`

The `CodeBlockShiki` component already had streaming support:

```typescript
export function CodeBlockShiki({ language, code, isStreaming = false }: CodeBlockProps) {
  // Debounces syntax highlighting during streaming
  const HIGHLIGHT_DEBOUNCE_MS = 600;
  
  // While streaming: shows plain text, delays highlighting
  // When complete: immediately highlights code
}
```

**Features**:
- **Debounced Highlighting**: Waits 600ms during streaming before highlighting
- **Plain Text Fallback**: Shows plain text while streaming to avoid flicker
- **Smooth Transition**: Fades in highlighted code when ready

## How It Works

### During Streaming:
1. New chunk arrives → `streamingContentRef.current` updated
2. `setMessages` called with new content
3. `MarkdownContent` receives `isStreaming={true}`
4. `CodeBlockShiki` shows plain text (no highlighting)
5. Highlighting is debounced (waits 600ms)
6. **Result**: Smooth, flicker-free text streaming

### After Streaming Completes:
1. `setStreamingMessageId(null)` called
2. `MarkdownContent` receives `isStreaming={false}`
3. `CodeBlockShiki` immediately highlights code
4. **Result**: Beautiful syntax-highlighted code appears

## Benefits

### Before Fix:
- ❌ Visible flickering on every chunk
- ❌ Code blocks re-highlighting constantly
- ❌ Poor user experience
- ❌ Distracting visual updates

### After Fix:
- ✅ Smooth, professional streaming
- ✅ No flickering during code generation
- ✅ Syntax highlighting only when complete
- ✅ Matches professional chat agents (ChatGPT, Claude, etc.)

## Performance Improvements

1. **Reduced Re-renders**: Custom `memo` comparison prevents unnecessary renders
2. **Debounced Highlighting**: Syntax highlighting only runs when needed
3. **Efficient Updates**: Only the streaming message updates, not the entire chat
4. **Smart Caching**: Highlighted code is cached and reused

## Testing

### Test Scenarios:
1. **Simple Code Block**:
   ```
   User: "Write a Python function to calculate fibonacci"
   Expected: Smooth streaming, no flicker
   ```

2. **Multiple Code Blocks**:
   ```
   User: "Show me examples in Python, JavaScript, and Go"
   Expected: Each block streams smoothly
   ```

3. **Long Code**:
   ```
   User: "Create a full React component with TypeScript"
   Expected: Smooth streaming even for 100+ lines
   ```

4. **Mixed Content**:
   ```
   User: "Explain async/await with code examples"
   Expected: Text and code both stream smoothly
   ```

## Technical Details

### Streaming Flow:
```
Backend Stream → processQueryStreaming() → StreamChunk
                                              ↓
                                    streamingContentRef.current += chunk.text
                                              ↓
                                    setMessages() with new content
                                              ↓
                                    MarkdownContent (isStreaming=true)
                                              ↓
                                    CodeBlockShiki (shows plain text)
                                              ↓
                                    [Debounce 600ms]
                                              ↓
                                    Syntax highlighting (if still streaming)
```

### Completion Flow:
```
Stream Complete → setStreamingMessageId(null)
                                              ↓
                                    MarkdownContent (isStreaming=false)
                                              ↓
                                    CodeBlockShiki (immediate highlight)
                                              ↓
                                    Beautiful syntax-highlighted code
```

## Files Modified

1. **PolarisAI-Frontend/components/ui/MarkdownContent.tsx**
   - Added `isStreaming` prop
   - Implemented custom `memo` comparison
   - Pass streaming state to code blocks

2. **PolarisAI-Frontend/components/MainAgentContent.tsx**
   - Pass `isStreaming` prop to `MarkdownContent`
   - Track streaming state with `streamingMessageId`

3. **PolarisAI-Frontend/components/ui/CodeBlockShiki.tsx**
   - Already had streaming support (no changes needed)
   - Debounces highlighting during streaming
   - Shows plain text fallback

## Future Enhancements

Potential improvements:
1. **Adaptive Debounce**: Adjust debounce time based on code length
2. **Progressive Highlighting**: Highlight completed lines while streaming continues
3. **Streaming Indicators**: Show subtle indicator when code is streaming
4. **Smooth Scrolling**: Auto-scroll to follow streaming content

## Notes

- The fix is backward compatible (isStreaming defaults to false)
- No breaking changes to existing components
- Performance impact is minimal (actually improves performance)
- Works with all programming languages supported by Shiki
