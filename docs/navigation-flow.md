# Manual Navigation Flow Implementation

## Overview

This implementation provides a complete manual interaction flow for Telegram bot users, allowing them to discover and apply for positions without needing the website interface. Users can start with `/start` and navigate through companies → departments → positions → interview process.

## Key Features

### 🚀 **Complete Navigation Flow**
- **Company Discovery**: Browse all companies with pagination and search
- **Department Exploration**: View departments within selected companies
- **Position Search**: Find positions within departments with detailed information
- **Seamless Transition**: Automatic progression to interview after position selection

### 🔍 **Advanced Search Functionality**
- **Company Search**: Search by name, description, city, country, industry
- **Department Search**: Search within company departments
- **Position Search**: Search by title, description, qualifications, responsibilities
- **Real-time Results**: Instant search results with proper error handling

### 📱 **Telegram-Optimized UX**
- **Inline Keyboards**: Interactive buttons for navigation
- **Pagination**: Handle large lists with page navigation
- **Responsive Design**: 2-button rows for companies/departments, single buttons for positions
- **Clear Navigation**: Back buttons and breadcrumb-style flow

## Implementation Details

### New Files Created

#### 1. `src/api/bots/navigationService.js`
**Purpose**: Core service handling company/department/position data retrieval and formatting

**Key Functions**:
- `getAllCompanies()`: Fetch all companies with industry information
- `searchCompanies(searchTerm)`: Search companies with multiple criteria
- `getCompanyDepartments(companyId)`: Get departments for a company
- `getDepartmentPositions(departmentId)`: Get positions with inheritance
- `formatCompanyForTelegram()`: Format company info for Telegram display
- `createCompaniesKeyboard()`: Generate interactive keyboards with pagination

**Database Integration**:
- Uses Prisma with proper relationships (Company → Department → Position)
- Applies field inheritance (position inherits company location if missing)
- Includes industry tags and position counts

### Modified Files

#### 1. `src/api/bots/telegramWebhookHandler.js`
**Major Changes**:

**Session State Extension**:
```javascript
// Added navigation state to session
selectedCompanyId: null,
selectedDepartmentId: null,
selectedPositionId: null,
currentNavigationStep: 'companies',
isSearching: false,
searchTerm: '',
currentPage: 0
```

**New Conversation Flow**:
- `navigationConversation()`: Main navigation handler
- `showCompanies()`: Display companies with search and pagination
- `showDepartments()`: Display departments for selected company
- `showPositions()`: Display positions for selected department
- `startInterviewFlow()`: Transition to Phase 1 interview

**Enhanced Callback Handling**:
```javascript
// Navigation callbacks
if (data.startsWith('company_') || data.startsWith('department_') || 
    data.startsWith('position_') || data.startsWith('search_') || 
    data.startsWith('back_to_')) {
  await ctx.conversation.reenter('navigationConversation');
}
```

**Updated Commands**:
- `/start`: Now enters `navigationConversation` instead of direct interview
- `/help`: Updated to reflect new navigation capabilities
- Text messages: Start navigation flow for new users

## User Experience Flow

### 1. **Start Flow** (`/start`)
```
👋 Welcome, [Name]!

I'm an AI recruiting bot that will help you find and apply for positions at various companies.

Let's start by selecting a company you're interested in. You can browse through all available companies or use the search function to find specific ones.

🔽 Choose a company below:
```

### 2. **Company Selection**
- Shows companies in 2-column grid with pagination
- Displays: Company name, location, industries, description
- Search functionality available
- Navigation: `🔍 Search Companies`

### 3. **Department Selection**
- Shows selected company information
- Lists departments with position counts
- Search within company departments
- Navigation: `🔍 Search Departments` | `⬅️ Back to Companies`

### 4. **Position Selection**
- Shows department information
- Lists all available positions (1 per row for readability)
- Detailed position information with inheritance
- Navigation: `🔍 Search Positions` | `⬅️ Back to Departments` | `🏠 Back to Companies`

### 5. **Position Details & Confirmation**
```
💼 Software Engineer

🏢 Company: Tech Corp
🏛️ Department: Engineering
📍 Location: New York, USA
💰 Salary: $80,000 - $120,000
⏰ Type: Full-time

📝 Description: [Job description]
✅ Qualifications: [Requirements]
📋 Responsibilities: [Key duties]

---

🎯 Great Choice!

You've selected the Software Engineer position at Tech Corp.

Now I'll guide you through our interview process:

📋 Phase 1: Basic information (16 questions, ~5-10 minutes)
🤖 Phase 2: AI-powered interview (Position-specific questions, ~10-15 minutes)

Ready to begin? Let's start with Phase 1! 🚀
```

### 6. **Interview Process**
- Automatically transitions to existing Phase 1 interview (16 questions)
- Candidate record includes selected position ID
- Continues to Phase 2 AI interview
- Full Bitrix CRM integration maintained

## Technical Features

### 🔄 **State Management**
- Session-based navigation state preservation
- Proper conversation flow transitions
- Callback data parsing and routing

### 🛡️ **Error Handling**
- Graceful fallbacks for missing data
- User-friendly error messages
- Automatic recovery from search errors

### 📊 **Data Inheritance**
- Positions inherit location from company if missing
- Complete candidate information through relationships
- Optimized database queries with includes

### 🔗 **Integration**
- Seamless connection to existing Phase 1/Phase 2 interview system
- Maintains all existing features (voice transcription, AI assessment, Bitrix CRM)
- Preserves existing bot commands and functionality

## Database Schema Usage

### **Companies → Departments → Positions**
```sql
-- Companies with industries
Company {
  industries: CompanyIndustry[]
}

-- Departments linked to companies
Department {
  companyId: Company.id
  positions: DepartmentPosition[]
}

-- Positions with many-to-many to departments
Position {
  departments: DepartmentPosition[]
}

-- Junction table
DepartmentPosition {
  departmentId: Department.id
  positionId: Position.id
}
```

### **Field Inheritance Logic**
```javascript
// Position inherits from company
if (!position.location && company.city && company.country) {
  position.location = `${company.city}, ${company.country}`;
}
```

## Best Practices Implemented

### 📱 **Telegram UX**
- Maximum 8 companies per page for readability
- 2-column layout for categories, single column for positions
- Clear button labels and navigation paths
- Consistent emoji usage for visual hierarchy

### 🔍 **Search UX**
- Minimum 2 characters for search activation
- Multiple search criteria (name, description, location)
- Case-insensitive search with PostgreSQL `ilike`
- Clear "no results" messaging with recovery options

### 🎯 **Conversation Flow**
- State preservation across navigation steps
- Proper session cleanup and initialization
- Graceful conversation transitions
- Non-blocking search input handling

### 🔧 **Code Organization**
- Separated navigation logic into dedicated service
- Modular conversation functions
- Reusable formatting and keyboard generation
- Clear separation of concerns

## Migration Notes

### **Backward Compatibility**
- All existing commands and flows preserved
- Phase 1/Phase 2 interview system unchanged
- Existing candidate records continue to work
- Bot webhook and admin functions unaffected

### **New Dependencies**
- Updated `telegramWebhookHandler.js` with navigation conversation
- Added `navigationService.js` for data handling
- Enhanced session state management
- Extended callback query handling

## Future Enhancements

### **Potential Improvements**
1. **Favorites System**: Allow users to bookmark companies/positions
2. **Application History**: Show previously applied positions
3. **Filters**: Advanced filtering by salary, location, employment type
4. **Recommendations**: AI-powered position suggestions
5. **Company Ratings**: Display company ratings and reviews
6. **Application Status**: Track application progress through bot

### **Performance Optimizations**
1. **Caching**: Redis cache for company/department lists
2. **Lazy Loading**: Load positions only when department selected
3. **Search Indexing**: Full-text search with PostgreSQL indices
4. **Image Support**: Company logos in navigation flow

This implementation provides a comprehensive, user-friendly interface that transforms the Telegram bot from a simple interview tool into a complete job discovery and application platform. 