# Entity Inheritance System

## Overview

The Entity Inheritance System automatically populates missing fields in child entities by inheriting data from their parent entities. This ensures that positions always have complete location information for the Telegram bot and web interface.

## Inheritance Hierarchy

```
Company (Parent)
├── city
├── country
├── address
├── phone
├── email
└── description

Department (Child of Company)
├── name
├── description
└── [inherits location data from Company]

Position (Child of Department/Company)
├── title
├── description
├── salaryRange
├── employmentType
├── location ← Inherits from Company (city + country)
├── city ← Inherits from Company
├── country ← Inherits from Company
├── qualifications
└── responsibilities
```

## Inheritance Rules

### Position Inheritance
Positions inherit location data from their associated company through the department relationship:

- **location**: Automatically set to `"${company.city}, ${company.country}"` if both are available
- **city**: Inherits from `company.city`
- **country**: Inherits from `company.country`

### When Inheritance Occurs

1. **During Position Creation**: When creating a new position via API
2. **During Position Update**: When updating an existing position (only fills missing fields)
3. **Manual Inheritance**: Using the inheritance script or service
4. **Validation Check**: When validating entities for SMS campaigns

## Implementation

### 1. Automatic Inheritance in API Handlers

Position creation and update handlers in `server.js` automatically apply inheritance:

```javascript
// Get company data through department
const department = await prisma.department.findUnique({
  where: { id: departmentId },
  include: { company: true }
});

// Apply inheritance
if (department?.company) {
  const company = department.company;
  
  if (!positionData.location && (company.city || company.country)) {
    positionData.location = `${company.city}, ${company.country}`;
  }
  
  if (!positionData.city && company.city) {
    positionData.city = company.city;
  }
  
  if (!positionData.country && company.country) {
    positionData.country = company.country;
  }
}
```

### 2. Inheritance Service

The `src/api/inheritance/inheritanceService.js` provides utility functions:

- `applyPositionInheritance(positionData, departmentId)`
- `updateEntityWithInheritance(entityType, entityId)`
- `applyDepartmentInheritance(departmentData, companyId)`

### 3. Validation Service Integration

The validation service considers inherited fields when checking entity completeness:

```javascript
export const applyInheritance = (entityType, entity) => {
  if (entityType !== 'position') return entity;
  
  const inheritedEntity = { ...entity };
  const company = entity.departments?.[0]?.department?.company;
  
  if (company) {
    // Apply inheritance logic
    if (!inheritedEntity.location && (company.city || company.country)) {
      inheritedEntity.location = `${company.city}, ${company.country}`;
    }
    // ... more inheritance rules
  }
  
  return inheritedEntity;
};
```

## Scripts

### Bulk Inheritance Update

Run the inheritance script to update all existing positions:

```bash
node scripts/entity-inheritance-updater.js
```

This script:
- ✅ Updates all positions with missing location data
- ✅ Creates the inheritance service
- ✅ Validates results
- ✅ Provides detailed logging

### Testing Inheritance

Test the inheritance logic:

```bash
node scripts/test-inheritance.js
```

## API Endpoints

### Position Creation with Inheritance

```bash
POST /api/positions
{
  "title": "Software Engineer",
  "description": "Develop amazing software",
  "salaryRange": "$50,000 - $70,000",
  "employmentType": "Full-time",
  "departmentId": "department-uuid"
}
```

Response includes inherited location data:
```json
{
  "success": true,
  "data": {
    "id": "position-uuid",
    "title": "Software Engineer",
    "location": "Tashkent, Uzbekistan",
    "city": "Tashkent",
    "country": "Uzbekistan"
  }
}
```

### Manual Inheritance Update

```bash
POST /api/inheritance/update
{
  "entityType": "position",
  "entityId": "position-uuid"
}
```

### Validation with Inheritance

```bash
GET /api/validation/entity/position/position-uuid
```

Returns validation results considering inherited fields.

## Benefits for Telegram Bot

With inheritance, the Telegram bot can always show complete position information:

- **Location**: Always available for job postings
- **Company Context**: Positions include company location details
- **Consistency**: All positions have standardized location format
- **Reduced Manual Work**: No need to manually enter location for each position

## Benefits for Web Interface

- **Complete Profiles**: All entities show comprehensive information
- **Reduced Validation Errors**: Fewer missing fields
- **Better User Experience**: Less form filling required
- **Data Consistency**: Standardized location format across all positions

## Testing Results

✅ **Script Execution**: Successfully updated 2 positions with inherited data
✅ **Inheritance Service**: Working correctly for manual updates
✅ **Validation Integration**: Considers inherited fields in completeness checks
✅ **API Integration**: Position creation/update handlers include inheritance

## Troubleshooting

### Position Not Inheriting Location

1. Check if department has a valid company relationship
2. Verify company has city/country data
3. Ensure position doesn't already have location data
4. Check server logs for inheritance debug messages

### Manual Fix

Use the inheritance service to manually update a position:

```javascript
import { updateEntityWithInheritance } from './src/api/inheritance/inheritanceService.js';
await updateEntityWithInheritance('position', 'position-uuid');
```

## Future Enhancements

- Department inheritance from company (address, phone, etc.)
- Position inheritance from department (additional context)
- Batch inheritance operations
- Inheritance conflict resolution
- Historical inheritance tracking 