# E-QMS Translation Guide

## Overview
This guide explains how to translate pages in the E-QMS frontend application. The application uses `react-i18next` for internationalization with Swedish as the primary language.

## Current Status

### ✅ Completed Pages
- Login (`/src/pages/Login.tsx`)
- Setup (`/src/pages/Setup.tsx`)
- Dashboard (`/src/pages/Dashboard.tsx`)
- Documents (`/src/pages/Documents.tsx`)
- Layout/Navigation (`/src/components/Layout.tsx`)

### 📋 Remaining Pages (48)
Core Modules:
- Audits.tsx
- AuditExecution.tsx
- AuditFindings.tsx
- NCR.tsx
- NCRDetail.tsx
- NCRDashboard.tsx
- CAPA.tsx
- CAPADetail.tsx
- CAPADashboard.tsx
- Equipment.tsx
- EquipmentReadOnly.tsx
- Training.tsx
- TrainingMatrix.tsx
- RoleTrainingRequirements.tsx

Detail/Edit Pages:
- DocumentView.tsx
- DocumentEditor.tsx
- PendingChanges.tsx
- ProcessOverview.tsx
- ProcessDetail.tsx
- Processes.tsx
- RiskDetail.tsx
- RiskBoard.tsx
- Risks.tsx
- ImprovementIdeas.tsx
- ImprovementIdeaDetail.tsx
- ImprovementStatusDashboard.tsx

Inspection Pages:
- InspectionPlanning.tsx
- InspectionSchedule.tsx
- InspectionRecords.tsx
- InspectionRecordDetail.tsx
- MobileInspectionForm.tsx

Equipment Records:
- CalibrationRecords.tsx
- CalibrationRecordDetail.tsx
- ServiceRecords.tsx
- ServiceRecordDetail.tsx

Admin/Settings:
- Users.tsx
- Departments.tsx
- Settings.tsx
- SystemSettings.tsx
- ApiKeys.tsx
- CompanyBranding.tsx
- EmailTemplates.tsx
- BackupManagement.tsx
- AuditLogs.tsx

Supplier:
- ApprovedSupplierList.tsx
- SupplierPerformanceDashboard.tsx

Other:
- ExternalAuditSupport.tsx
- ChartDemo.tsx

### 🔧 Components (10)
- AttachmentGallery.tsx
- CAPAForm.tsx
- ExpiringCertificates.tsx
- FileUpload.tsx
- ImageUpload.tsx
- ImplementationTasks.tsx
- MissingCompetencies.tsx
- NCRForm.tsx
- ToastContainer.tsx

## How to Translate a Page

### Step 1: Import the Translation Hook
At the top of your component file, add:
```typescript
import { useTranslation } from 'react-i18next';
```

### Step 2: Use the Hook in Your Component
Inside your component function:
```typescript
function MyComponent() {
  const { t } = useTranslation();
  // ... rest of component
}
```

### Step 3: Replace Hardcoded Text
Replace all hardcoded English text with translation keys:

**Before:**
```tsx
<h1>Document Management</h1>
<button>Create Document</button>
<p>No documents found</p>
```

**After:**
```tsx
<h1>{t('documents.title')}</h1>
<button>{t('documents.createDocument')}</button>
<p>{t('messages.noData')}</p>
```

### Step 4: Check Translation Keys Exist
All translation keys are defined in:
- `/frontend/src/locales/sv/translation.json` (Swedish)
- `/frontend/src/locales/en/translation.json` (English)

If you need a new translation key that doesn't exist, add it to both files.

## Available Translation Namespaces

### Common UI Elements
```typescript
t('common.save')           // Spara
t('common.cancel')         // Avbryt
t('common.delete')         // Ta bort
t('common.edit')           // Redigera
t('common.create')         // Skapa
t('common.loading')        // Laddar...
t('common.search')         // Sök
t('common.filter')         // Filtrera
t('common.status')         // Status
t('common.date')           // Datum
t('common.actions')        // Åtgärder
```

### Forms
```typescript
t('forms.requiredField')   // Detta fält är obligatoriskt
t('forms.invalidEmail')    // Ogiltig e-postadress
t('forms.selectOption')    // Välj ett alternativ
```

### Messages
```typescript
t('messages.createSuccess')  // Skapad framgångsrikt
t('messages.updateSuccess')  // Uppdaterad framgångsrikt
t('messages.deleteSuccess')  // Borttagen framgångsrikt
t('messages.loadError')      // Fel vid laddning av data
t('messages.noData')         // Ingen data tillgänglig
t('messages.noResults')      // Inga resultat hittades
```

### Module-Specific
```typescript
// Documents
t('documents.title')              // Dokument
t('documents.createDocument')     // Skapa dokument
t('documents.documentNumber')     // Dokumentnummer

// Audits
t('audits.title')                 // Revisioner
t('audits.createAudit')           // Skapa revision
t('audits.auditNumber')           // Revisionsnummer

// NCR
t('ncr.title')                    // Avvikelserapporter
t('ncr.createNCR')                // Skapa avvikelse
t('ncr.ncrNumber')                // Avvikelsenummer

// CAPA
t('capa.title')                   // CAPA
t('capa.createCAPA')              // Skapa CAPA
t('capa.capaNumber')              // CAPA-nummer

// Equipment
t('equipment.title')              // Utrustning
t('equipment.equipmentNumber')    // Utrustningsnummer
t('equipment.calibration')        // Kalibrering

// Training
t('training.title')               // Utbildning
t('training.trainingName')        // Utbildningsnamn
t('training.competencies')        // Kompetenser
```

## Translation Pattern Examples

### Page Title and Header
```tsx
<div className="page-header">
  <div>
    <h1>{t('MODULE.title')}</h1>
    <p className="subtitle">{t('MODULE.description')}</p>
  </div>
  <button className="tw-btn tw-btn-primary">
    {t('MODULE.createItem')}
  </button>
</div>
```

### Table Headers
```tsx
<thead>
  <tr>
    <th>{t('common.name')}</th>
    <th>{t('common.type')}</th>
    <th>{t('common.status')}</th>
    <th>{t('common.date')}</th>
    <th>{t('common.actions')}</th>
  </tr>
</thead>
```

### Forms
```tsx
<div className="form-group">
  <label htmlFor="email">{t('auth.email')}</label>
  <input
    id="email"
    type="email"
    placeholder={t('auth.email')}
    required
  />
</div>

<button type="submit" disabled={loading}>
  {loading ? t('common.loading') : t('common.submit')}
</button>
```

### Error Messages
```tsx
try {
  await someAction();
  toast.success(t('messages.createSuccess'));
} catch (error) {
  toast.error(t('messages.createError'));
}
```

### Conditional Text
```tsx
{filteredItems.length === 0 ? (
  <p>{searchTerm ? t('messages.noResults') : t('messages.noData')}</p>
) : (
  // ... render items
)}
```

### Loading States
```tsx
if (loading) {
  return <div className="loading">{t('common.loading')}</div>;
}
```

## Best Practices

1. **Don't translate technical identifiers**: Leave API field names, database columns, and technical keys in English
2. **Keep translations contextual**: Use the appropriate namespace (e.g., `documents.*`, `audits.*`)
3. **Reuse common translations**: Use `common.*` for buttons, actions, and frequently used terms
4. **Test thoroughly**: After translating, verify all text displays correctly in the UI
5. **Consistency**: Use the same translation for the same concept throughout the application

## Adding New Translation Keys

If you need a translation that doesn't exist:

1. Add it to `/frontend/src/locales/sv/translation.json`:
```json
{
  "myModule": {
    "newKey": "Ny svensk text"
  }
}
```

2. Add the same key to `/frontend/src/locales/en/translation.json`:
```json
{
  "myModule": {
    "newKey": "New English text"
  }
}
```

3. Use it in your component:
```tsx
{t('myModule.newKey')}
```

## Testing Your Translations

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Navigate to the translated page
3. Verify all text is in Swedish
4. Check that:
   - Buttons display correctly
   - Form labels are translated
   - Error messages appear in Swedish
   - Loading states show Swedish text
   - Table headers and data labels are translated

## Language Switching (Future Enhancement)

Currently, Swedish is the default and primary language. To add language switching:

1. Create a language selector component
2. Store the selected language in localStorage or user settings
3. Update the i18n configuration to use the selected language

## Need Help?

- Review completed pages for reference patterns
- Check `/frontend/src/locales/sv/translation.json` for available keys
- Follow the same patterns used in Login.tsx, Dashboard.tsx, and Documents.tsx

## Translation Coverage Summary

| Category | Completed | Total | Progress |
|----------|-----------|-------|----------|
| Critical Pages | 5 | 5 | 100% ✅ |
| Core Modules | 1 | 14 | 7% |
| Detail Pages | 0 | 10 | 0% |
| Inspection | 0 | 5 | 0% |
| Equipment Records | 0 | 4 | 0% |
| Admin/Settings | 0 | 9 | 0% |
| Supplier | 0 | 2 | 0% |
| Other | 0 | 2 | 0% |
| Components | 0 | 10 | 0% |
| **Total** | **6** | **61** | **10%** |

The most critical user-facing pages (Login, Setup, Dashboard, Layout, Documents) are complete, providing a solid Swedish experience for primary workflows.
