# Dashboard Builder V2 - With Saved Queries & AI Suggestions

## Overview
Enhanced dashboard builder that uses saved queries from the Query Editor and provides AI-powered chart type suggestions based on user preferences.

## ✅ New Features

### 1. Saved Query Integration
- **No Manual Query Writing**: Users select from their saved queries instead of writing new ones
- **Query Library**: Fetches all saved queries from `/query` page
- **Query Details**: Shows query name and contract address
- **Empty State**: Guides users to create queries in Query Editor first

### 2. AI Chart Suggestions
- **Learning System**: Tracks user's visualization preferences
- **Smart Suggestions**: Recommends chart types based on past selections
- **Confidence Scores**: Shows match percentage for each suggestion
- **Threshold**: Only suggests after user has made 2+ selections
- **Auto-Selection**: Automatically selects top suggestion

### 3. Database Storage
- **Dashboards Table**: Stores dashboard metadata
- **Widgets Table**: Stores widget configurations with positions
- **Preferences Table**: Tracks user's chart type selections for AI learning
- **Proper Relations**: Foreign keys and cascading deletes

## Database Schema

### Tables Created (Migration 009)

#### `dashboards`
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (FK to users)
- name: TEXT
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `dashboard_widgets`
```sql
- id: INTEGER PRIMARY KEY
- dashboard_id: INTEGER (FK to dashboards)
- query_id: INTEGER (FK to contract_queries)
- title: TEXT
- visualization_type: TEXT (bar|line|pie|table|number)
- position_x: INTEGER
- position_y: INTEGER
- width: INTEGER
- height: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `widget_preferences`
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (FK to users)
- query_id: INTEGER (FK to contract_queries)
- visualization_type: TEXT
- selection_count: INTEGER
- last_selected_at: TIMESTAMP
- UNIQUE(user_id, query_id, visualization_type)
```

## API Endpoints

### Dashboard Management
```
POST   /api/dashboard-builder              - Create dashboard
GET    /api/dashboard-builder              - Get user's dashboards
GET    /api/dashboard-builder/{id}         - Get dashboard with widgets
DELETE /api/dashboard-builder/{id}         - Delete dashboard
```

### Widget Management
```
POST   /api/dashboard-builder/{id}/widgets - Add widget to dashboard
PUT    /api/dashboard-builder/widgets/{id} - Update widget position/size
DELETE /api/dashboard-builder/widgets/{id} - Delete widget
```

### Query & AI Features
```
GET    /api/dashboard-builder/queries      - Get saved queries
GET    /api/dashboard-builder/suggest/{query_id} - Get AI suggestions
```

## AI Suggestion Algorithm

### How It Works:
1. **Track Selections**: Every time user adds a widget, record:
   - User ID
   - Query ID
   - Visualization type chosen
   - Increment selection count

2. **Generate Suggestions**: When user selects a query:
   - Check if user has made 2+ total selections
   - If yes, fetch preferences for this query
   - Also fetch global preferences across all queries
   - Calculate confidence scores
   - Return top 3 suggestions

3. **Confidence Calculation**:
   ```
   confidence = (selection_count / total_selections) * 100
   ```

### Example Scenarios:

#### Scenario 1: New User (< 2 selections)
- **Result**: No suggestions shown
- **UI**: Only manual chart type selector
- **Reason**: Not enough data to make recommendations

#### Scenario 2: User with History (2+ selections)
- **User has used**: Bar chart 5 times, Line chart 2 times
- **Total selections**: 7
- **Suggestions**:
  1. Bar Chart - 71% confidence - "You've used bar 5 time(s) for similar queries"
  2. Line Chart - 29% confidence - "You frequently use line charts"

#### Scenario 3: Query-Specific Preference
- **For Query A**: User always picks Table
- **For Query B**: User always picks Bar
- **Result**: When selecting Query A, Table is suggested first

## Frontend Changes

### DashboardBuilder.tsx Updates

#### New State:
```typescript
- savedQueries: SavedQuery[]          // Fetched from backend
- loadingQueries: boolean             // Loading state
- selectedQueryId: number | null      // Currently selected query
- suggestions: ChartSuggestion[]      // AI suggestions
- loadingSuggestions: boolean         // Suggestion loading state
```

#### New Functions:
```typescript
- fetchSavedQueries()                 // Load user's saved queries
- fetchChartSuggestions(queryId)      // Get AI suggestions for query
```

#### Dialog Changes:
- Removed: Query textarea (no manual writing)
- Added: Saved query dropdown
- Added: AI suggestions section with confidence badges
- Added: Empty state for no saved queries
- Added: Link to Query Editor

### UI Flow:

1. **User clicks "Add Widget"**
   - Dialog opens
   - Saved queries load automatically

2. **User selects a query**
   - AI suggestions fetch automatically
   - Top suggestion auto-selected (if available)
   - Confidence scores displayed

3. **User sees suggestions**
   - Green highlight on selected type
   - Confidence percentage badge
   - Reason for suggestion
   - Can click to select different type

4. **User can override**
   - Manual dropdown still available
   - "Or Choose Manually" label when suggestions exist

5. **User adds widget**
   - Widget created with selected query
   - Preference recorded for AI learning
   - Dashboard updated

## Backend Implementation

### Models (`models/dashboard.rs`)
- `Dashboard`: Dashboard metadata
- `DashboardWidget`: Widget configuration
- `WidgetPreference`: AI learning data
- `ChartSuggestion`: AI suggestion response
- `DashboardWithWidgets`: Full dashboard response

### Handlers (`handlers/dashboard_builder.rs`)
- `create_dashboard`: Create new dashboard
- `get_user_dashboards`: List user's dashboards
- `get_dashboard_with_widgets`: Get full dashboard
- `add_widget_to_dashboard`: Add widget + record preference
- `get_saved_queries`: Fetch user's saved queries
- `suggest_chart_type`: AI suggestion logic
- `update_widget_position`: Update widget layout
- `delete_widget`: Remove widget
- `delete_dashboard`: Remove dashboard

### Routes (`routes/dashboard_builder.rs`)
- RESTful API endpoints
- Proper error handling
- Authentication required

## Usage Guide

### For Users:

1. **Create Queries First**
   - Go to `/query` page
   - Write and test your queries
   - Save them with descriptive names

2. **Build Dashboard**
   - Go to `/builder` page
   - Click "Add Widget"
   - Select a saved query
   - See AI suggestions (after 2+ uses)
   - Choose or override chart type
   - Add widget

3. **AI Learns**
   - Every selection is recorded
   - After 2 selections, AI starts suggesting
   - More selections = better suggestions
   - Suggestions are personalized per user

### For Developers:

#### Adding New Chart Types:
1. Update `visualization_type` CHECK constraint in migration
2. Add type to `VisualizationWidget['type']` in frontend
3. Add icon in `getVisualizationIcon()`
4. Add rendering in `renderVisualization()`
5. Add to Select dropdown

#### Improving AI:
- Adjust confidence calculation in `suggest_chart_type()`
- Add query content analysis (keywords, structure)
- Consider time-based weighting (recent selections)
- Add collaborative filtering (what similar users choose)

## Testing

### Manual Testing:

1. **Test No Queries**:
   - Fresh user, no saved queries
   - Should see empty state with link to Query Editor

2. **Test First Selection**:
   - Create and save 1 query
   - Add widget with Bar chart
   - Should see no suggestions yet

3. **Test AI Activation**:
   - Add second widget with Line chart
   - Add third widget
   - Should now see suggestions

4. **Test Suggestions**:
   - Select a query you've used before
   - Should see your previous choice suggested
   - Confidence should match usage ratio

5. **Test Override**:
   - Select suggested type
   - Change to different type manually
   - Both selections should be recorded

### Database Verification:

```sql
-- Check preferences
SELECT * FROM widget_preferences WHERE user_id = 1;

-- Check suggestion logic
SELECT 
    visualization_type,
    SUM(selection_count) as total,
    (SUM(selection_count) * 100.0 / (SELECT SUM(selection_count) FROM widget_preferences WHERE user_id = 1)) as confidence
FROM widget_preferences
WHERE user_id = 1
GROUP BY visualization_type
ORDER BY total DESC;
```

## Benefits

### For Users:
- ✅ Faster dashboard creation (no query rewriting)
- ✅ Consistent queries across widgets
- ✅ Personalized suggestions
- ✅ Learn from past choices
- ✅ Reduced decision fatigue

### For System:
- ✅ Query reusability
- ✅ Better data consistency
- ✅ User behavior insights
- ✅ Improved UX over time
- ✅ Proper data relationships

## Future Enhancements

### Phase 1:
- [ ] Query content analysis for smarter suggestions
- [ ] Collaborative filtering (what similar users choose)
- [ ] Time-based weighting (recent preferences matter more)
- [ ] Dashboard templates based on popular combinations

### Phase 2:
- [ ] Auto-refresh widgets with saved queries
- [ ] Query parameter support
- [ ] Dashboard sharing with preserved queries
- [ ] Export dashboard as JSON

### Phase 3:
- [ ] Real-time collaboration
- [ ] Version history for dashboards
- [ ] A/B testing different visualizations
- [ ] Advanced AI with ML models

## Migration Guide

### From V1 to V2:

1. **Run Migration**:
   ```bash
   # Migration 009 will run automatically
   cargo run
   ```

2. **Existing Dashboards**:
   - V1 dashboards (in-memory) won't persist
   - Users need to recreate using saved queries
   - This is expected - V1 was prototype

3. **User Communication**:
   - Inform users about saved query requirement
   - Guide them to Query Editor first
   - Explain AI suggestion benefits

## Notes

- AI suggestions require minimum 2 selections to activate
- Preferences are per-user, not global
- Deleting a query doesn't delete widgets (FK constraint prevents)
- Dashboard deletion cascades to widgets
- All timestamps are UTC
- Confidence scores are percentages (0-100)

## Troubleshooting

### No Suggestions Appearing:
- Check user has made 2+ widget selections
- Verify `widget_preferences` table has data
- Check API response in browser console

### Saved Queries Not Loading:
- Verify user has saved queries in Query Editor
- Check `/api/dashboard-builder/queries` endpoint
- Ensure auth token is valid

### Widget Not Saving:
- Check query_id exists in contract_queries table
- Verify dashboard ownership
- Check browser console for errors

## API Response Examples

### Get Saved Queries:
```json
{
  "success": true,
  "queries": [
    {
      "id": 1,
      "name": "Daily Transactions",
      "query": "SELECT date, COUNT(*) FROM txs GROUP BY date",
      "contract_address": "0x123...",
      "created_at": "2024-12-30T10:00:00Z"
    }
  ]
}
```

### Get AI Suggestions:
```json
{
  "success": true,
  "has_suggestions": true,
  "suggestions": [
    {
      "visualization_type": "bar",
      "confidence": 71.4,
      "reason": "You've used bar 5 time(s) for similar queries"
    },
    {
      "visualization_type": "line",
      "confidence": 28.6,
      "reason": "You frequently use line charts"
    }
  ]
}
```

### No Suggestions (< 2 selections):
```json
{
  "success": true,
  "has_suggestions": false,
  "suggestions": []
}
```
