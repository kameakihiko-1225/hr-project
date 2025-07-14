# Code Refactoring Plan

This document outlines the plan for refactoring duplicate code in the Aurora HRMS Portal project.

## Identified Duplicates

### 1. Logger Implementation
- **Files**: `src/lib/logger.ts` and `src/lib/logger.js`
- **Decision**: Keep TypeScript version (`logger.ts`) and update all imports
- **Reason**: TypeScript provides better type safety and the implementation is more comprehensive with log levels

### 2. Environment Configuration
- **Files**: `src/lib/env.ts` and `src/lib/env.js`
- **Decision**: Keep TypeScript version (`env.ts`) and update all imports
- **Reason**: TypeScript version is more comprehensive and has better error handling

### 3. Authentication Service
- **Files**: `src/lib/auth.ts` and `src/api/auth/authService.ts`
- **Decision**: Keep API version (`authService.ts`) and update all imports
- **Reason**: The API version is more comprehensive and follows the project's service pattern better

### 4. Cache Implementation
- **Files**: `src/lib/cache.js` and `src/lib/memoryCache.js`
- **Decision**: Consolidate into a single cache module with memory fallback
- **Reason**: The current implementation already uses memory cache as fallback, but the code is split across two files

### 5. Toast Hook
- **Files**: `src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts`
- **Decision**: Keep `hooks/use-toast.ts` as the source and make `components/ui/use-toast.ts` import from it
- **Reason**: The implementation in `hooks/use-toast.ts` is the actual implementation, while the UI version just re-exports it

## Refactoring Steps

### Phase 1: Analyze and Document
1. ✅ Run the `refactor-duplicates.js` script to generate a detailed report
2. ✅ Review the report and confirm the refactoring plan
3. ✅ Create this refactoring plan document

### Phase 2: Refactor Utilities
1. **Logger**:
   - Update all imports from `logger.js` to use `logger.ts`
   - Remove `logger.js` once all imports are updated

2. **Environment**:
   - Update all imports from `env.js` to use `env.ts`
   - Remove `env.js` once all imports are updated

3. **Toast Hook**:
   - Ensure `components/ui/use-toast.ts` correctly imports from `hooks/use-toast.ts`
   - Update any imports that directly use the UI version

### Phase 3: Refactor Services
1. **Authentication Service**:
   - Update all imports from `lib/auth.ts` to use `api/auth/authService.ts`
   - Remove `lib/auth.ts` once all imports are updated

2. **Cache Implementation**:
   - Consolidate `cache.js` and `memoryCache.js` into a single file
   - Update all imports to use the consolidated file

### Phase 4: Test and Verify
1. Run the application to ensure all functionality works correctly
2. Run tests to verify that the refactoring hasn't broken anything
3. Check for any runtime errors related to the refactored code

### Phase 5: Clean Up
1. Remove any remaining duplicate files
2. Update documentation to reflect the changes
3. Commit the changes with a clear message about the refactoring

## Implementation Script

A script has been created to help with the refactoring process:
- `scripts/refactor-duplicates.js`: Analyzes the codebase for duplicates and generates a report

To run the script:
```bash
node scripts/refactor-duplicates.js
```

The report will be generated at `docs/code-duplication-report.md`.

## Best Practices for Future Development

To avoid code duplication in the future:

1. **Centralize Utilities**: Keep utility functions in dedicated files and import them where needed
2. **Follow DRY Principle**: Don't Repeat Yourself - extract common code into reusable functions
3. **Use TypeScript**: Prefer TypeScript over JavaScript for better type safety and tooling
4. **Document Code**: Add JSDoc comments to explain the purpose of functions and classes
5. **Regular Refactoring**: Schedule regular refactoring sessions to clean up the codebase
6. **Code Reviews**: Pay attention to potential duplication during code reviews
7. **Testing**: Maintain good test coverage to ensure refactoring doesn't break functionality 