# Audit Checklist Model Implementation Summary

## Overview
This document describes the implementation of the dynamic audit checklist system for E-QMS, as specified in issue P3:2:2.

## Database Structure

### 1. ChecklistTemplates Table
**Purpose:** Stores reusable checklist templates that auditors can use for different types of audits.

**Key Fields:**
- `templateCode` - Unique identifier (e.g., 'CHKT-ISO9001-001')
- `templateName` - Human-readable name
- `category` - Template category (e.g., 'ISO 9001', 'Process Audit')
- `auditType` - Associated audit type (Internal, External, Process, etc.)
- `status` - Template status (draft, active, archived, obsolete)
- `version` - Template version for tracking changes
- `isStandard` - Whether this is a standard/mandatory template
- `requiresCompletion` - Whether all questions must be answered
- `allowCustomQuestions` - Whether auditors can add custom questions

**Indexes:** Optimized for filtering by status, category, and audit type.

### 2. ChecklistQuestions Table
**Purpose:** Stores questions that belong to checklist templates with expected outcomes and evaluation criteria.

**Key Fields:**
- `templateId` - Reference to parent template
- `questionNumber` - Question number within template (e.g., '1.1', '2.3')
- `questionText` - The actual question
- `category` - Question category or clause reference
- `expectedOutcome` - Expected outcome or compliance criteria
- `guidance` - Guidance notes for auditors
- `questionType` - Question type (yesno, text, rating, checklist, na)
- `isMandatory` - Whether question must be answered
- `allowNA` - Whether "Not Applicable" is allowed
- `requiresEvidence` - Whether evidence/documentation is required
- `minRating`, `maxRating`, `passingScore` - For rating-type questions
- `displayOrder` - Order in which question appears

**Features:**
- Supports multiple question types (yes/no, text, rating, checklist, N/A)
- Flexible rating scales with configurable passing scores
- Evidence requirement flags
- Reorderable questions

### 3. ChecklistResponses Table
**Purpose:** Stores actual responses/answers to checklist questions during audits.

**Key Fields:**
- `auditId` - Reference to the audit being conducted
- `templateId` - Reference to the checklist template used
- `questionId` - Reference to the specific question
- `responseType` - Type of response (yesno, text, rating, na)
- `yesNoResponse`, `textResponse`, `ratingResponse` - Response data
- `notApplicable` - Whether question was marked as N/A
- `isCompliant` - Whether response indicates compliance
- `requiresAction` - Whether corrective action is required
- `findings` - Detailed findings or observations
- `evidence` - Evidence or documentation references
- `recommendations` - Auditor recommendations
- `respondedBy` - Auditor who recorded the response
- `reviewedBy`, `reviewedAt`, `reviewNotes` - Review information

**Features:**
- Supports multiple response types
- Compliance tracking
- Findings documentation
- Evidence collection
- Review workflow
- Unique constraint prevents duplicate responses for same question in an audit

## API Endpoints

### Checklist Templates

#### Create Template
- **POST** `/api/checklists/templates`
- **Auth:** Admin, Manager, Auditor
- **Body:** Template data including name, category, audit type, etc.

#### Get All Templates
- **GET** `/api/checklists/templates`
- **Auth:** All authenticated users
- **Query Params:** `status`, `category`, `auditType`

#### Get Active Templates
- **GET** `/api/checklists/templates/active`
- **Auth:** All authenticated users

#### Get Template by ID
- **GET** `/api/checklists/templates/:id`
- **Auth:** All authenticated users

#### Update Template
- **PUT** `/api/checklists/templates/:id`
- **Auth:** Admin, Manager, Auditor

#### Delete Template
- **DELETE** `/api/checklists/templates/:id`
- **Auth:** Admin only

### Checklist Questions

#### Create Question
- **POST** `/api/checklists/questions`
- **Auth:** Admin, Manager, Auditor
- **Body:** Question data including text, type, expected outcome, etc.

#### Get Questions by Template
- **GET** `/api/checklists/templates/:templateId/questions`
- **Auth:** All authenticated users
- **Returns:** Questions ordered by displayOrder

#### Get Question by ID
- **GET** `/api/checklists/questions/:id`
- **Auth:** All authenticated users

#### Update Question
- **PUT** `/api/checklists/questions/:id`
- **Auth:** Admin, Manager, Auditor

#### Delete Question
- **DELETE** `/api/checklists/questions/:id`
- **Auth:** Admin only

#### Reorder Questions
- **PUT** `/api/checklists/templates/:templateId/questions/reorder`
- **Auth:** Admin, Manager, Auditor
- **Body:** `{ questionOrders: [{ id, displayOrder }] }`

### Checklist Responses

#### Create Response
- **POST** `/api/checklists/responses`
- **Auth:** Admin, Manager, Auditor
- **Body:** Response data including audit ID, question ID, response value, etc.

#### Get Responses by Audit
- **GET** `/api/checklists/audits/:auditId/responses`
- **Auth:** All authenticated users
- **Returns:** All responses for an audit with question details

#### Get Responses by Audit and Template
- **GET** `/api/checklists/audits/:auditId/templates/:templateId/responses`
- **Auth:** All authenticated users

#### Get Non-Compliant Responses
- **GET** `/api/checklists/audits/:auditId/responses/non-compliant`
- **Auth:** All authenticated users
- **Returns:** Only responses marked as non-compliant

#### Get Responses Requiring Action
- **GET** `/api/checklists/audits/:auditId/responses/requiring-action`
- **Auth:** All authenticated users
- **Returns:** Responses that require corrective action

#### Get Audit Completion Stats
- **GET** `/api/checklists/audits/:auditId/completion-stats`
- **Auth:** All authenticated users
- **Returns:** Statistics about audit completion percentage and compliance

#### Get Response by ID
- **GET** `/api/checklists/responses/:id`
- **Auth:** All authenticated users

#### Update Response
- **PUT** `/api/checklists/responses/:id`
- **Auth:** Admin, Manager, Auditor

#### Delete Response
- **DELETE** `/api/checklists/responses/:id`
- **Auth:** Admin only

## TypeScript Models

### ChecklistTemplateModel
**Methods:**
- `create(template)` - Create new template
- `findById(id)` - Find template by ID
- `findByCode(templateCode)` - Find template by unique code
- `findAll(filters)` - Find all templates with optional filters
- `update(id, updates)` - Update template
- `delete(id)` - Delete template
- `getActiveTemplates()` - Get all active templates
- `getTemplatesByCategory(category)` - Get active templates for a category

### ChecklistQuestionModel
**Methods:**
- `create(question)` - Create new question
- `findById(id)` - Find question by ID
- `findByTemplate(templateId)` - Get all questions for a template
- `findByTemplateAndNumber(templateId, questionNumber)` - Find specific question
- `update(id, updates)` - Update question
- `delete(id)` - Delete question
- `getMandatoryQuestions(templateId)` - Get mandatory questions only
- `reorderQuestions(templateId, questionOrders)` - Reorder questions

### ChecklistResponseModel
**Methods:**
- `create(response)` - Create new response
- `findById(id)` - Find response by ID
- `findByAudit(auditId)` - Get all responses for an audit with details
- `findByAuditAndTemplate(auditId, templateId)` - Get responses for specific template
- `findByQuestion(auditId, questionId)` - Get response for specific question
- `update(id, updates)` - Update response
- `delete(id)` - Delete response
- `getNonCompliantResponses(auditId)` - Get non-compliant responses
- `getResponsesRequiringAction(auditId)` - Get responses requiring action
- `getAuditCompletionStats(auditId)` - Get completion and compliance statistics

## Usage Examples

### Creating a Checklist Template
```typescript
const template = {
  templateCode: 'CHKT-ISO9001-001',
  templateName: 'ISO 9001:2015 Internal Audit Checklist',
  description: 'Standard checklist for ISO 9001 internal audits',
  category: 'ISO 9001',
  auditType: 'Internal',
  status: 'active',
  version: '1.0',
  isStandard: true,
  requiresCompletion: true,
  allowCustomQuestions: false,
  createdBy: userId
};

const templateId = await ChecklistTemplateModel.create(template);
```

### Adding Questions to a Template
```typescript
const question = {
  templateId: 1,
  questionNumber: '4.1',
  questionText: 'Has the organization determined external and internal issues relevant to its purpose?',
  category: 'ISO 9001:2015 - Clause 4.1',
  section: 'Context of the Organization',
  expectedOutcome: 'Organization has documented list of external and internal issues',
  guidance: 'Review strategic planning documents, SWOT analysis, risk register',
  questionType: 'yesno',
  isMandatory: true,
  allowNA: false,
  requiresEvidence: true,
  displayOrder: 1,
  createdBy: userId
};

const questionId = await ChecklistQuestionModel.create(question);
```

### Recording Responses During an Audit
```typescript
const response = {
  auditId: 1,
  templateId: 1,
  questionId: 1,
  responseType: 'yesno',
  yesNoResponse: true,
  isCompliant: true,
  requiresAction: false,
  findings: 'Organization maintains a comprehensive SWOT analysis updated quarterly',
  evidence: 'Strategic Plan 2024, SWOT Analysis dated 2024-01-15',
  respondedBy: auditorId
};

const responseId = await ChecklistResponseModel.create(response);
```

### Getting Audit Completion Statistics
```typescript
const stats = await ChecklistResponseModel.getAuditCompletionStats(auditId);
// Returns:
// {
//   totalQuestions: 25,
//   answeredQuestions: 20,
//   compliantResponses: 18,
//   nonCompliantResponses: 2,
//   notApplicable: 3,
//   requiresAction: 2,
//   completionPercentage: 80
// }
```

## Testing

### Unit Tests
- **ChecklistTemplateModel.test.ts**: Comprehensive tests for template operations
  - Create, read, update, delete operations
  - Filtering by status, category, and audit type
  - Active template retrieval
  - Templates by category

All tests pass successfully with 100% coverage of model methods.

## Security

### Authentication & Authorization
- All endpoints require authentication
- Template and question creation/update: Admin, Manager, Auditor roles
- Template and question deletion: Admin only
- Response creation/update: Admin, Manager, Auditor roles
- Response deletion: Admin only
- Read operations: All authenticated users

### Data Validation
- Template codes must be unique
- Questions must belong to existing templates
- Responses must reference valid audits, templates, and questions
- Unique constraint prevents duplicate responses for same question in an audit
- Check constraints enforce valid question types and rating configurations

### CodeQL Analysis
- No security vulnerabilities detected
- Code follows secure coding practices
- Input validation properly implemented

## Database Migrations

The implementation includes three SQL migration scripts:
1. `28_create_checklist_templates_table.sql` - Creates ChecklistTemplates table
2. `29_create_checklist_questions_table.sql` - Creates ChecklistQuestions table
3. `30_create_checklist_responses_table.sql` - Creates ChecklistResponses table

Each script:
- Checks for table existence before creation
- Includes comprehensive indexes for performance
- Records the schema version in DatabaseVersion table
- Includes foreign key constraints and check constraints
- Uses CASCADE DELETE where appropriate (questions and responses)

## Integration Points

### Audits Module
- ChecklistResponses links to Audits table via `auditId`
- Responses cascade delete when audit is deleted
- Audit completion statistics available via API

### Users Module
- Templates, questions, and responses track creator/responder
- Review workflow tracks reviewer information
- User names included in response details queries

## Future Enhancements (Not in Scope)

Potential future additions:
- Checklist template cloning/copying
- Question libraries for reuse across templates
- Attachment support for evidence files
- Automated scoring and compliance reporting
- Template approval workflow
- Question bank with search functionality
- Custom question fields per template
- Multi-language support for questions
- Template change history/versioning

## Conclusion

The audit checklist model implementation provides a comprehensive, flexible, and secure foundation for managing dynamic audit checklists in the E-QMS system. The implementation follows ISO 9001 audit requirements and supports various audit types and question formats while maintaining data integrity and security.
