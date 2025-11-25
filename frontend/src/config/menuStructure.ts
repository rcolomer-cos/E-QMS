// Menu configuration system with IDs for easy menu item management
export interface MenuItem {
  id: string;
  label: string; // Translation key
  path?: string;
  submenu?: MenuItem[];
  requiredModule?: string;
  requiredRole?: string[];
  requireAnyRole?: string[];
  hideForRoles?: string[];
}

export const MENU_IDS = {
  DASHBOARD: 'dashboard',
  QUALITY_SYSTEM: 'quality-system',
  OPERATIONS: 'operations',
  EQUIPMENT_ASSETS: 'equipment-assets',
  PEOPLE_ORGANIZATION: 'people-organization',
  ANALYSIS: 'analysis',
  SUPPLIERS: 'suppliers',
  ADMINISTRATION: 'administration',
} as const;

export const menuStructure: MenuItem[] = [
  {
    id: MENU_IDS.DASHBOARD,
    label: 'navigation.dashboard',
    path: '/',
  },
  {
    id: MENU_IDS.QUALITY_SYSTEM,
    label: 'navigation.qualitySystem',
    submenu: [
      {
        id: 'processes',
        label: 'navigation.processes',
        path: '/processes/overview',
        requiredModule: 'processes',
      },
        {
        id: 'documents',
        label: 'navigation.documents',
        path: '/documents',
        requiredModule: 'documents',
      },

      {
        id: 'pending-changes',
        label: 'navigation.pendingChanges',
        path: '/pending-changes',
      },
    ],
  },
  {
    id: MENU_IDS.OPERATIONS,
    label: 'navigation.operations',
    submenu: [
      {
        id: 'audits',
        label: 'navigation.audits',
        path: '/audits',
        requiredModule: 'audits',
      },
      {
        id: 'external-audit',
        label: 'navigation.externalAudit',
        path: '/external-audit-support',
        requiredModule: 'audits',
        requireAnyRole: ['admin', 'manager', 'superuser', 'auditor'],
      },
      {
        id: 'ncr',
        label: 'navigation.ncr',
        path: '/ncr',
        requiredModule: 'ncr',
      },
      {
        id: 'capa',
        label: 'navigation.capa',
        path: '/capa',
        requiredModule: 'capa',
      },
      {
        id: 'mobile-inspection',
        label: 'navigation.mobileInspection',
        path: '/inspection-mobile',
        requiredModule: 'inspection',
      },
    ],
  },
  {
    id: MENU_IDS.EQUIPMENT_ASSETS,
    label: 'navigation.equipmentAssets',
    requiredModule: 'equipment',
    submenu: [
      {
        id: 'equipment',
        label: 'navigation.equipment',
        path: '/equipment',
      },
      {
        id: 'service-records',
        label: 'navigation.serviceRecords',
        path: '/service-records',
      },
      {
        id: 'inspection-records',
        label: 'navigation.inspectionRecords',
        path: '/inspection-records',
        requiredModule: 'inspection',
      },
    ],
  },
  {
    id: MENU_IDS.PEOPLE_ORGANIZATION,
    label: 'navigation.peopleOrganization',
    submenu: [
      {
        id: 'org-chart',
        label: 'navigation.orgChart',
        path: '/organizational-chart',
      },
      {
        id: 'training',
        label: 'navigation.training',
        path: '/training',
        requiredModule: 'training',
      },
      {
        id: 'training-matrix',
        label: 'navigation.trainingMatrix',
        path: '/training-matrix',
        requiredModule: 'training',
      },
      {
        id: 'role-requirements',
        label: 'navigation.roleRequirements',
        path: '/role-training-requirements',
        requiredModule: 'training',
        requireAnyRole: ['admin', 'manager', 'superuser'],
      },
      {
        id: 'work-roles',
        label: 'navigation.workRoles',
        path: '/work-roles',
        requireAnyRole: ['manager', 'superuser'],
      },
      {
        id: 'skill-levels',
        label: 'navigation.skillLevels',
        path: '/skill-levels',
      },
      {
        id: 'user-work-roles',
        label: 'navigation.userWorkRoles',
        path: '/user-work-roles',
        requireAnyRole: ['manager', 'superuser'],
      },
      {
        id: 'users',
        label: 'navigation.users',
        path: '/settings?tab=users',
        requireAnyRole: ['admin', 'manager', 'superuser'],
      },
      {
        id: 'groups',
        label: 'navigation.groups',
        path: '/settings?tab=groups',
        requireAnyRole: ['admin', 'manager', 'superuser'],
      },
      {
        id: 'departments',
        label: 'navigation.departments',
        path: '/departments',
        requireAnyRole: ['admin', 'manager', 'superuser'],
      },
    ],
  },
  {
    id: MENU_IDS.ANALYSIS,
    label: 'navigation.analysis',
    submenu: [
      {
        id: 'risks',
        label: 'navigation.risks',
        path: '/risks',
        requiredModule: 'risks',
      },
      {
        id: 'risk-board',
        label: 'navigation.riskBoard',
        path: '/risks/board',
        requiredModule: 'risks',
      },
      {
        id: 'improvements',
        label: 'navigation.improvements',
        path: '/improvement-ideas',
        requiredModule: 'improvements',
      },
      {
        id: 'swot-analysis',
        label: 'navigation.swotAnalysis',
        path: '/swot-analysis',
        requiredModule: 'improvements',
      },
    ],
  },
  {
    id: MENU_IDS.SUPPLIERS,
    label: 'navigation.suppliers',
    requireAnyRole: ['admin', 'manager', 'superuser'],
    submenu: [
      {
        id: 'supplier-performance',
        label: 'navigation.supplierPerformance',
        path: '/supplier-performance',
      },
      {
        id: 'approved-suppliers',
        label: 'navigation.approvedSuppliers',
        path: '/approved-supplier-list',
      },
    ],
  },
  {
    id: MENU_IDS.ADMINISTRATION,
    label: 'navigation.admin',
    requireAnyRole: ['admin', 'manager', 'superuser'],
    submenu: [
      {
        id: 'settings',
        label: 'navigation.settings',
        path: '/settings',
      },
      {
        id: 'system-settings',
        label: 'navigation.systemSettings',
        path: '/system-settings',
        submenu: [
          {
            id: 'system-settings-general',
            label: 'General Settings',
            path: '/system-settings?tab=general',
          },
          {
            id: 'company-branding',
            label: 'navigation.companyBranding',
            path: '/system-settings?tab=branding',
          },
          {
            id: 'email-templates',
            label: 'navigation.emailTemplates',
            path: '/system-settings?tab=email',
          },
          {
            id: 'api-keys',
            label: 'navigation.apiKeys',
            path: '/system-settings?tab=api-keys',
          },
          {
            id: 'backup-management',
            label: 'navigation.backupManagement',
            path: '/system-settings?tab=backup',
          },
          {
            id: 'audit-logs',
            label: 'navigation.auditLogs',
            path: '/system-settings?tab=audit',
          },
          {
            id: 'data-import',
            label: 'navigation.dataImport',
            path: '/system-settings?tab=import',
            requiredRole: ['superuser'],
          },
        ],
      },
    ],
  },
];

// Helper function to find a menu item by ID
export function findMenuItemById(id: string, items: MenuItem[] = menuStructure): MenuItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.submenu) {
      const found = findMenuItemById(id, item.submenu);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to add a menu item to a specific parent
export function addMenuItemToParent(parentId: string, newItem: MenuItem): boolean {
  const parent = findMenuItemById(parentId);
  if (parent) {
    if (!parent.submenu) {
      parent.submenu = [];
    }
    parent.submenu.push(newItem);
    return true;
  }
  return false;
}

// Helper function to remove a menu item by ID
export function removeMenuItemById(id: string, items: MenuItem[] = menuStructure): boolean {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      items.splice(i, 1);
      return true;
    }
    if (items[i].submenu) {
      if (removeMenuItemById(id, items[i].submenu!)) {
        return true;
      }
    }
  }
  return false;
}
