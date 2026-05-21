# Flight Data Display Fix

## Problem
Flight search results were showing incomplete data in the UI:
- Airline names showing as "Airline" (placeholder)
- Departure/arrival times showing as `00:00 → 00:00` (zeros) or `--:--` (dashes)
- Missing flight numbers
- Duration showing as "2 hr 0 min" instead of actual duration
- Data was coming from backend correctly but not being properly extracted and displayed

## Root Cause
The `extractFlightInfo` function in `MainAgentContent.tsx` was only parsing ONE markdown table format, but the AI was generating TWO different formats:

**Format 1** (Old format):
```
| IndiGo 6E 6798 | IndiGo | 00:15 | 01:35 | 80 min | ₹4683 | Direct |
```

**Format 2** (New format with full datetime):
```
| IndiGo | 6E 2419 | 2026-05-10 05:05 | 2026-05-10 07:15 | 2h 10m | ₹7,756 |
```

The parser was only handling Format 1, so when the AI used Format 2, all the data extraction failed, resulting in:
- Empty airline names → "Airline"
- Empty times → "00:00"
- Empty durations → "2 hr 0 min"

## Solution

### 1. Added Support for Both Table Formats

**File**: `PolarisAI-Frontend/components/MainAgentContent.tsx`

Added a new regex pattern to handle Format 2 (with full datetime):

```typescript
// Format 2: | IndiGo | 6E 2419 | 2026-05-10 05:05 | 2026-05-10 07:15 | 2h 10m | ₹7,756 |
const tableRowRegex2 = /\|\s*([^|\n]+?)\s*\|\s*([A-Z0-9\s]+?)\s*\|\s*\d{4}-\d{2}-\d{2}\s+(\d{1,2}:\d{2})\s*\|\s*\d{4}-\d{2}-\d{2}\s+(\d{1,2}:\d{2})\s*\|\s*([^|\n]+?)\s*\|\s*₹?\s*([\d,]+)\s*\|/gim;
```

### 2. Parsing Priority

The parser now tries formats in order:
1. **Try Format 2 first** (with datetime) - Most common in current responses
2. **Fall back to Format 1** (simple times) - If Format 2 finds nothing

```typescript
// Try Format 2 first
for (const m of content.matchAll(tableRowRegex2)) {
  // Parse airline, flight number, times, duration, price
  flights.push({ ... });
}

// Try Format 1 if Format 2 didn't find anything
if (flights.length === 0) {
  for (const m of content.matchAll(tableRowRegex)) {
    // Parse with old format
    flights.push({ ... });
  }
}
```

### 3. Format 2 Parsing Details

**Input**:
```
| IndiGo | 6E 2419 | 2026-05-10 05:05 | 2026-05-10 07:15 | 2h 10m | ₹7,756 |
```

**Extraction**:
- Column 1: `IndiGo` → airline
- Column 2: `6E 2419` → flight number (spaces removed → `6E2419`)
- Column 3: `2026-05-10 05:05` → extract time `05:05`
- Column 4: `2026-05-10 07:15` → extract time `07:15`
- Column 5: `2h 10m` → duration
- Column 6: `₹7,756` → price (₹7756)

**Output**:
```javascript
{
  airline: "IndiGo",
  flightNumber: "6E2419",
  departureTime: "05:05",
  arrivalTime: "07:15",
  duration: "2h 10m",
  price: 7756,
  stops: 0
}
```

### 2. Added Comprehensive Logging

Added debug logs at key points:

```typescript
console.log('[Flight Extraction] Parsed flight:', {
  airline: resolvedAirline,
  flightNumber,
  depTime,
  arrTime,
  price,
  duration: durationStr
});
```

### 3. Improved Data Structure Mapping

Enhanced the `mapToFlightStructure` function:

```typescript
const baseFlightLeg = {
  airline: f.airline || 'Unknown Airline',  // Fallback for empty airline
  flight_number: f.flightNumber || '',
  departure_airport: {
    name: origin,
    id: getAirportCode(origin),
    time: f.departureTime || '00:00'  // Fallback for empty time
  },
  arrival_airport: {
    name: destination,
    id: getAirportCode(destination),
    time: f.arrivalTime || '00:00'  // Fallback for empty time
  },
  duration: f.duration ? parseDurationToMinutes(f.duration) : 120,
  airplane: f.airplane || ''
};
```

### 4. Added Logging for Final Data

```typescript
console.log('[Flight Mapping] Creating flight structure for:', f);
console.log('[Flight Mapping] Base flight leg:', baseFlightLeg);
console.log('[Flight Mapping] Final flight structure:', result);
console.log('[Flight Extraction] Final flight data:', flightData);
```

## How It Works

### Parsing Flow:
```
AI Response (Markdown Table)
         ↓
Table Row Regex Match
         ↓
Extract Columns (Flight Info | Airline | Times | Duration | Price | Type)
         ↓
Airline Resolution (4 strategies)
         ↓
Flight Number Extraction
         ↓
Create Flight Object
         ↓
Map to Display Structure
         ↓
FlightResultsCard Component
```

### Airline Resolution Strategies:

1. **Direct Column**: Use airline name from dedicated column
2. **Flight Info Parsing**: Extract from "IndiGo 6E 6798" format
3. **Code Mapping**: Map "6E" → "IndiGo" using airline code dictionary
4. **Fallback**: Use first word or "Unknown Airline"

## Example Parsing

### Input (Markdown Table):
```
| IndiGo 6E 6798 | IndiGo | 00:15 | 01:35 | 80 min | ₹4683 | Direct |
| 6E 284 | | 05:15 | 06:40 | 85 min | ₹5313 | Direct |
```

### Parsed Output:
```javascript
[
  {
    airline: "IndiGo",        // From column 2
    flightNumber: "6E6798",
    departureTime: "00:15",
    arrivalTime: "01:35",
    duration: "80 min",
    price: 4683,
    stops: 0
  },
  {
    airline: "IndiGo",        // Derived from "6E" code
    flightNumber: "6E284",
    departureTime: "05:15",
    arrivalTime: "06:40",
    duration: "85 min",
    price: 5313,
    stops: 0
  }
]
```

## Debugging

### Check Browser Console:
```javascript
// Look for these logs:
[Flight Extraction] Parsed flight: { airline: "IndiGo", ... }
[Flight Mapping] Creating flight structure for: { ... }
[Flight Mapping] Base flight leg: { ... }
[Flight Mapping] Final flight structure: { ... }
[Flight Extraction] Final flight data: { ... }
```

### Verify Data Structure:
```javascript
// Expected structure:
{
  from: "Pune",
  to: "Indore",
  date: "May 10, 2026",
  best_flights: [
    {
      price: 4813,
      total_duration: 120,
      flights: [
        {
          airline: "IndiGo",
          flight_number: "6E6798",
          departure_airport: { name: "Pune", id: "PNQ", time: "00:15" },
          arrival_airport: { name: "Indore", id: "IDR", time: "01:35" },
          duration: 80,
          airplane: ""
        }
      ],
      layovers: []
    }
  ],
  other_flights: [...]
}
```

## Testing

### Test Cases:

1. **Complete Data**:
   ```
   Query: "Flights from Pune to Indore on May 10"
   Expected: All fields populated correctly
   ```

2. **Missing Airline Column**:
   ```
   Table: | 6E 284 | | 05:15 | 06:40 | ... |
   Expected: Airline derived from "6E" → "IndiGo"
   ```

3. **Unknown Airline Code**:
   ```
   Table: | XY 123 | | 05:15 | 06:40 | ... |
   Expected: Airline shows "XY 123" or "Unknown Airline"
   ```

4. **Empty Times**:
   ```
   Table: | IndiGo | IndiGo | | | 80 min | ₹4683 | Direct |
   Expected: Times show "00:00" as fallback
   ```

## Files Modified

1. **PolarisAI-Frontend/components/MainAgentContent.tsx**
   - Enhanced airline name extraction (4 strategies)
   - Added comprehensive logging
   - Improved fallback handling
   - Better empty string detection

## Benefits

### Before Fix:
- ❌ Airline showing as "Airline"
- ❌ Times showing as `--:--`
- ❌ Incomplete flight information
- ❌ Poor user experience

### After Fix:
- ✅ Correct airline names displayed
- ✅ Proper departure/arrival times
- ✅ Complete flight information
- ✅ Professional flight card display
- ✅ Debug logs for troubleshooting

## Future Enhancements

1. **AI Response Format**: Ensure backend always provides complete data in consistent format
2. **Validation**: Add data validation before rendering
3. **Error Handling**: Show user-friendly messages for incomplete data
4. **Caching**: Cache airline code mappings for better performance
