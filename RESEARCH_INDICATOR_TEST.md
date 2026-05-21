# Deep Research Indicator Testing Guide

## Changes Made to Force Visibility

### 1. Direct Rendering in Message Content
Added DeepResearchIndicator directly in the assistant message rendering area (line ~3900), right after flight results and before markdown content:

```typescript
{/* Show DeepResearchIndicator directly when research phases exist */}
{(() => {
  const phases = (timelineMessageId === message.id && researchPhases.length > 0) 
    ? researchPhases 
    : messageResearchPhases[message.id];
  
  if (phases && phases.length > 0) {
    console.log('[MainAgentContent] 🔍 Rendering DeepResearchIndicator for message:', message.id, phases);
    return (
      <div className="mb-4">
        <DeepResearchIndicator phases={phases} />
      </div>
    );
  }
  return null;
})()}
```

### 2. Enhanced Logging
Added comprehensive console logging to track:
- When `timeline_research_step` events are received
- Full chunk data structure
- Phase updates (add/update)
- Search query updates (add/update)
- Source additions
- Current state before and after updates

### 3. Multiple Render Locations
The DeepResearchIndicator is now rendered in THREE places:
1. **In Timeline** (via TimelineContainer prop)
2. **Directly in message content** (new - most visible)
3. **During thinking state** (via TimelineContainer prop)

## How to Test

### Step 1: Open Browser Console
Open DevTools (F12) and go to Console tab to see all the debug logs.

### Step 2: Trigger Deep Research
Ask the AI:
```
do a deep research on quantum computing
```

### Step 3: Watch Console Logs
You should see logs like:
```
[MainAgent] 📡 Research progress update received: timeline_research_step {...}
[MainAgent] 📡 Full chunk: {...}
[MainAgent] ✅ Forwarding research step to timeline: {...}
[MainAgent] 📊 Current research phases before update: [...]
[MainAgent] 🔍 Phase index: 0 for step.id: planning
[MainAgent] ➕ Adding new phase: planning
[MainAgent] 📊 Updated research phases: [...]
[MainAgentContent] 🔍 Rendering DeepResearchIndicator for message: assistant-123 [...]
```

### Step 4: Visual Verification
You should see the DeepResearchIndicator component showing:
- **Planning** phase (purple spinner when active, green dot when done)
- **Searching** phase with live search queries appearing
  - Each query shows as a row with search icon
  - Sources appear as chips below each query
  - Source count badge on the right
- **Analyzing** phase
- **Synthesizing** phase with word count

## Troubleshooting

### If Component Still Not Visible

#### Check 1: Are Events Being Received?
Look for this in console:
```
[MainAgent] 📡 Research progress update received: timeline_research_step
```

If **NOT** present:
- Backend is not emitting events
- Check `PolarisAI-Backend/research/researchService.js`
- Verify `emitResearchStep` is being called

If **PRESENT**:
- Events are reaching frontend
- Continue to Check 2

#### Check 2: Is State Being Updated?
Look for this in console:
```
[MainAgent] 📊 Updated research phases: [{id: 'planning', status: 'active', ...}]
```

If **NOT** present:
- Event handler not processing correctly
- Check the `case 'timeline_research_step':` handler

If **PRESENT**:
- State is updating correctly
- Continue to Check 3

#### Check 3: Is Component Rendering?
Look for this in console:
```
[MainAgentContent] 🔍 Rendering DeepResearchIndicator for message: assistant-123 [...]
```

If **NOT** present:
- Phases array is empty or not being passed correctly
- Check the render condition: `if (phases && phases.length > 0)`

If **PRESENT**:
- Component is rendering
- Check for CSS/styling issues

#### Check 4: CSS/Styling Issues
If logs show rendering but nothing visible:
1. Inspect element in DevTools
2. Look for the DeepResearchIndicator div
3. Check if it has `display: none` or `opacity: 0`
4. Check if parent container is hiding it

### Manual Test: Force Render
To test if the component works at all, temporarily add this at the top of the assistant message content (around line 3900):

```typescript
{/* TEMPORARY TEST - Remove after verification */}
<div className="mb-4 p-4 bg-blue-900/20 border border-blue-500">
  <p className="text-white mb-2">TEST: DeepResearchIndicator</p>
  <DeepResearchIndicator phases={[
    {
      id: 'planning',
      status: 'done',
      planTitle: 'Test Research Plan'
    },
    {
      id: 'searching',
      status: 'active',
      searchQueries: [
        {
          id: 'sq-1',
          text: 'Test Query 1',
          status: 'active',
          sources: ['example.com', 'test.com'],
          sourceCount: 2
        }
      ]
    }
  ]} />
</div>
```

If this shows up, the component works and the issue is with state management.
If this doesn't show up, there's a component or import issue.

## Expected Behavior

When working correctly, you should see:

1. **Planning Phase** (2-3 seconds)
   - Purple spinner icon
   - "Planning" label
   - Transitions to green dot when done

2. **Searching Phase** (30-60 seconds)
   - Blue spinner icon
   - "Researching" label
   - Live search queries appearing one by one:
     - Each query has a blue spinner (active) or search icon (done)
     - Query text (e.g., "AI in Healthcare")
     - Source count badge (e.g., "5 sources")
     - Source chips below (e.g., "nature.com", "arxiv.org")
   - May show "Expanding research scope" divider if replanning occurs
   - Transitions to green dot with final stats when done

3. **Analyzing Phase** (5-10 seconds)
   - Orange spinner icon
   - "Analyzing" label
   - Transitions to green dot when done

4. **Synthesizing Phase** (10-20 seconds)
   - Pink spinner icon
   - "Synthesizing" label
   - Word count badge when done (e.g., "4523 words")
   - Transitions to green dot when done

## Files Modified
- `PolarisAI-Frontend/components/MainAgentContent.tsx`
  - Added direct rendering of DeepResearchIndicator in message content
  - Enhanced logging in event handler
  - Added state debugging

## Next Steps if Still Not Working

1. Share console logs from a test run
2. Check Network tab for SSE events
3. Verify backend is actually calling research agent
4. Check if research agent is being triggered at all
