# Deep Research Timeline Display Fix

## Problem
When users triggered deep research from the main chat, the dynamic timeline component showing research progress (planning, searching, analyzing, synthesizing phases) was not displaying, even though the backend was emitting the events correctly.

## Root Cause
The `DeepResearchIndicator` component existed and was imported in `MainAgentContent.tsx`, but:
1. **No event handler** for `timeline_research_step` events in MainAgentContent
2. **No state management** to track research phases
3. **No props passed** to TimelineContainer to display research phases

The events were flowing correctly:
- ✅ ResearchService emits `timeline_research_step` events
- ✅ MainAgent forwards them to timeline
- ❌ MainAgentContent had no handler to process them
- ❌ DeepResearchIndicator was never rendered

## Solution Implemented

### 1. Added Research Phase State Management
```typescript
// Added state to track research phases
const [researchPhases, setResearchPhases] = useState<ResearchPhase[]>([]);
const [messageResearchPhases, setMessageResearchPhases] = useState<Record<string, ResearchPhase[]>>({});
```

### 2. Added Event Handler for `timeline_research_step`
Added handler in both main flow and confirmation flow to process research step events with incremental updates:

```typescript
case 'timeline_research_step':
  if (chunk.researchStep) {
    const step = chunk.researchStep;
    
    setResearchPhases((prev) => {
      const updated = [...prev];
      const phaseIndex = updated.findIndex(p => p.id === step.id);
      
      if (phaseIndex >= 0) {
        const existingPhase = updated[phaseIndex];
        
        // Handle search query updates (incremental)
        if (step.searchQuery) {
          const searchQueries = existingPhase.searchQueries || [];
          const queryIndex = searchQueries.findIndex(q => q.id === step.searchQuery.id);
          
          if (queryIndex >= 0) {
            // Update existing query
            const existingQuery = searchQueries[queryIndex];
            
            // Handle adding a source incrementally
            if (step.searchQuery.addSource) {
              searchQueries[queryIndex] = {
                ...existingQuery,
                sources: [...existingQuery.sources, step.searchQuery.addSource],
              };
            } else {
              // Update query status and other fields
              searchQueries[queryIndex] = {
                ...existingQuery,
                ...step.searchQuery,
                sources: existingQuery.sources,
              };
            }
          } else {
            // Add new query
            searchQueries.push({
              id: step.searchQuery.id,
              text: step.searchQuery.text,
              status: step.searchQuery.status || 'active',
              sources: step.searchQuery.addSource ? [step.searchQuery.addSource] : [],
              sourceCount: step.searchQuery.sourceCount,
            });
          }
          
          updated[phaseIndex] = {
            ...existingPhase,
            searchQueries,
            status: step.status || existingPhase.status,
          };
        } else if (step.replanningTriggered) {
          // Mark replanning point
          const currentQueryCount = existingPhase.searchQueries?.length || 0;
          updated[phaseIndex] = {
            ...existingPhase,
            replanningPoints: [...(existingPhase.replanningPoints || []), currentQueryCount - 1],
          };
        } else {
          // General phase update
          updated[phaseIndex] = {
            ...existingPhase,
            ...step,
            searchQueries: existingPhase.searchQueries,
            replanningPoints: existingPhase.replanningPoints,
          };
        }
      } else {
        // Add new phase
        updated.push({
          id: step.id,
          status: step.status || 'idle',
          searchQueries: step.searchQuery ? [{
            id: step.searchQuery.id,
            text: step.searchQuery.text,
            status: step.searchQuery.status || 'active',
            sources: step.searchQuery.addSource ? [step.searchQuery.addSource] : [],
          }] : [],
          replanningPoints: [],
        });
      }
      
      return updated;
    });
  }
  break;
```

**Key Features:**
- **Incremental updates**: Sources are added one-by-one as they're discovered
- **Query tracking**: Each search query has a unique ID and accumulates sources
- **Replanning detection**: Marks points where research scope expanded
- **Status updates**: Tracks active/done status for each query and phase

### 3. Persisted Research Phases
When streaming completes, research phases are stored per message:

```typescript
case 'done':
  // Store timeline events
  setMessageTimelines((prev) => ({
    ...prev,
    [assistantMessageId]: [...timelineEvents],
  }));
  
  // Store research phases
  if (researchPhases.length > 0) {
    setMessageResearchPhases((prev) => ({
      ...prev,
      [assistantMessageId]: [...researchPhases],
    }));
  }
```

### 4. Passed Research Phases to TimelineContainer
Updated all TimelineContainer renders to include research phases:

```typescript
<TimelineContainer
  events={timelineEvents}
  isVisible={showTimeline}
  onToggleVisibility={() => setShowTimeline(!showTimeline)}
  researchPhases={researchPhases.length > 0 ? researchPhases : undefined}
/>
```

### 5. Reset Research Phases on New Query
```typescript
setTimelineEvents([]); // Reset timeline for new query
setResearchPhases([]); // Reset research phases for new query
```

## Files Modified
- `PolarisAI-Frontend/components/MainAgentContent.tsx`
  - Added research phase state management
  - Added `timeline_research_step` event handler (main flow)
  - Added `timeline_research_step` event handler (confirmation flow)
  - Added research phase persistence on stream completion
  - Passed research phases to TimelineContainer components
  - Reset research phases on new query

## How It Works Now

### Event Flow
1. User asks: "do a deep research on machine learning"
2. Backend ResearchService emits `timeline_research_step` events with phase updates
3. MainAgent forwards events to timeline
4. **MainAgentContent now processes these events** and updates `researchPhases` state
5. TimelineContainer receives `researchPhases` prop
6. Timeline renders DeepResearchIndicator with live phase updates
7. User sees real-time research progress with:
   - Planning phase
   - Searching phase (with live search queries and sources)
   - Analyzing phase
   - Synthesizing phase (with word count)

### Research Phase Structure
```typescript
interface ResearchPhase {
  id: 'planning' | 'searching' | 'analyzing' | 'synthesizing';
  status: 'idle' | 'active' | 'done' | 'error';
  planTitle?: string;
  searchQueries?: SearchQueryItem[];
  replanningPoints?: number[];
  totalSources?: number;
  totalSearches?: number;
  wordCount?: number;
}
```

### Visual Result
Users now see a live, hierarchical timeline showing:
- ✅ Planning: Research plan creation
- ✅ Searching: Live search queries with source counts
  - Individual search queries with status (active/done)
  - Source domains collected per query
  - Replanning indicators when research scope expands
- ✅ Analyzing: Progress analysis
- ✅ Synthesizing: Report generation with word count

## Testing
To test the fix:
1. Ask: "do a deep research on artificial intelligence"
2. Observe the timeline showing:
   - Planning phase activating
   - Searching phase with live queries appearing
   - Sources being collected under each query
   - Analyzing phase
   - Synthesizing phase with word count
3. Verify the indicator persists after completion
4. Verify historical research timelines show correctly when viewing old messages

## Related Components
- `DeepResearchIndicator.tsx` - Renders the research phase UI (already existed)
- `Timeline.tsx` - Passes research phases to DeepResearchIndicator
- `researchService.js` - Emits timeline_research_step events
- `mainAgent.js` - Forwards research events to timeline

## Notes
- The DeepResearchIndicator component was already fully implemented and working
- The issue was purely in the event handling and state management in MainAgentContent
- No design changes were made, only made existing components visible
- Research phases are stored per message for historical viewing
- Both main flow and confirmation flow support research phase tracking
