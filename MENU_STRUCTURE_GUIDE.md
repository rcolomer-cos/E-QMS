# Menu Structure System - Usage Guide

## Overview
The menu system now uses a centralized, ID-based configuration that makes it easy to add, remove, or modify menu items without editing the Layout component directly.

## Menu Structure Location
`frontend/src/config/menuStructure.ts`

## Adding a New Menu Item

### Example 1: Add a new item to an existing submenu

```typescript
import { menuStructure, MENU_IDS, MenuItem } from '../config/menuStructure';

// Add "Quality Planning" to the Quality System menu
const qualitySystemMenu = menuStructure.find(m => m.id === MENU_IDS.QUALITY_SYSTEM);
if (qualitySystemMenu && qualitySystemMenu.submenu) {
  qualitySystemMenu.submenu.push({
    id: 'quality-planning',
    label: 'navigation.qualityPlanning',
    path: '/quality-planning',
    requiredModule: 'documents', // Optional: requires module to be enabled
    requireAnyRole: ['admin', 'manager'], // Optional: requires at least one role
  });
}
```

### Example 2: Add a new top-level menu with submenu

```typescript
import { menuStructure, MenuItem } from '../config/menuStructure';

const newMenu: MenuItem = {
  id: 'reporting',
  label: 'navigation.reporting',
  submenu: [
    {
      id: 'compliance-reports',
      label: 'navigation.complianceReports',
      path: '/reports/compliance',
    },
    {
      id: 'performance-reports',
      label: 'navigation.performanceReports',
      path: '/reports/performance',
      requireAnyRole: ['admin', 'manager'],
    },
  ],
};

// Insert before Administration menu
const adminIndex = menuStructure.findIndex(m => m.id === 'administration');
if (adminIndex !== -1) {
  menuStructure.splice(adminIndex, 0, newMenu);
}
```

### Example 3: Using helper functions

```typescript
import { addMenuItemToParent, MENU_IDS } from '../config/menuStructure';

// Add a new item to Operations submenu
addMenuItemToParent(MENU_IDS.OPERATIONS, {
  id: 'inspections',
  label: 'navigation.inspections',
  path: '/inspections',
  requiredModule: 'inspection',
});
```

## Menu Item Properties

```typescript
interface MenuItem {
  id: string;                    // Unique identifier
  label: string;                 // Translation key (e.g., 'navigation.dashboard')
  path?: string;                 // Route path (e.g., '/documents')
  submenu?: MenuItem[];          // Child menu items
  requiredModule?: string;       // Module must be enabled (e.g., 'documents')
  requiredRole?: string[];       // Must have ALL these roles
  requireAnyRole?: string[];     // Must have AT LEAST ONE of these roles
  hideForRoles?: string[];       // Hide for these roles
}
```

## Available Menu IDs

```typescript
MENU_IDS.DASHBOARD              // Dashboard (top-level)
MENU_IDS.QUALITY_SYSTEM         // Quality System submenu
MENU_IDS.OPERATIONS             // Operations & Quality submenu
MENU_IDS.EQUIPMENT_ASSETS       // Equipment & Assets submenu
MENU_IDS.PEOPLE_ORGANIZATION    // People & Organization submenu
MENU_IDS.ANALYSIS               // Analysis & Improvement submenu
MENU_IDS.SUPPLIERS              // Suppliers submenu
MENU_IDS.ADMINISTRATION         // Administration submenu
```

## Role-Based Access Examples

```typescript
// Item visible to specific roles only
{
  id: 'system-admin',
  label: 'navigation.systemAdmin',
  path: '/system-admin',
  requireAnyRole: ['admin', 'superuser'],
}

// Item requiring ALL specified roles (rare case)
{
  id: 'special-feature',
  label: 'navigation.specialFeature',
  path: '/special-feature',
  requiredRole: ['admin', 'auditor'], // Must be both admin AND auditor
}

// Item hidden from certain roles
{
  id: 'basic-view',
  label: 'navigation.basicView',
  path: '/basic-view',
  hideForRoles: ['admin'], // Hide from admins
}
```

## Module Visibility

Items with `requiredModule` will only appear if that module is enabled in Settings > Module Visibility:

```typescript
{
  id: 'training',
  label: 'navigation.training',
  path: '/training',
  requiredModule: 'training', // Only shows if training module is enabled
}
```

## Helper Functions

### Find a menu item by ID
```typescript
import { findMenuItemById } from '../config/menuStructure';

const item = findMenuItemById('equipment');
if (item) {
  console.log(item.label, item.path);
}
```

### Add item to parent
```typescript
import { addMenuItemToParent } from '../config/menuStructure';

addMenuItemToParent('equipment-assets', {
  id: 'maintenance-schedule',
  label: 'navigation.maintenanceSchedule',
  path: '/maintenance-schedule',
});
```

### Remove a menu item
```typescript
import { removeMenuItemById } from '../config/menuStructure';

removeMenuItemById('data-import'); // Removes the item completely
```

## Translation Keys

Don't forget to add corresponding translation keys in:
- `frontend/src/locales/en/translation.json`
- `frontend/src/locales/sv/translation.json`

Example:
```json
{
  "navigation": {
    "qualityPlanning": "Quality Planning",
    "complianceReports": "Compliance Reports"
  }
}
```

## Best Practices

1. **Use descriptive IDs**: Use kebab-case (e.g., 'supplier-performance')
2. **Keep structure flat**: Avoid nesting submenus deeper than 2 levels
3. **Group logically**: Keep related items together
4. **Consider order**: Items appear in the order they're defined
5. **Test visibility**: Verify role and module restrictions work as expected
6. **Update translations**: Always add translation keys for new items

## Complete Example: Adding a Reports Menu

```typescript
// 1. Add to menuStructure.ts
export const MENU_IDS = {
  // ... existing IDs
  REPORTS: 'reports',
} as const;

// 2. Add to menuStructure array (before Administration)
const adminIndex = menuStructure.findIndex(m => m.id === MENU_IDS.ADMINISTRATION);
menuStructure.splice(adminIndex, 0, {
  id: MENU_IDS.REPORTS,
  label: 'navigation.reports',
  requireAnyRole: ['admin', 'manager'],
  submenu: [
    {
      id: 'audit-reports',
      label: 'navigation.auditReports',
      path: '/reports/audits',
      requiredModule: 'audits',
    },
    {
      id: 'ncr-reports',
      label: 'navigation.ncrReports',
      path: '/reports/ncr',
      requiredModule: 'ncr',
    },
  ],
});

// 3. Add translations
// en/translation.json
{
  "navigation": {
    "reports": "Reports",
    "auditReports": "Audit Reports",
    "ncrReports": "NCR Reports"
  }
}

// 4. Add routes in App.tsx
<Route path="reports/audits" element={<AuditReports />} />
<Route path="reports/ncr" element={<NCRReports />} />
```

That's it! The menu system will automatically handle visibility, permissions, and rendering.
