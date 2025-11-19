# Organizational Chart - User Guide

## Quick Start

### Accessing the Organizational Chart

1. Log in to the E-QMS application
2. Click **"Organizational Chart"** in the main navigation menu
3. The chart will load showing your organization's complete structure

## Visual Layout

The organizational chart uses a tree structure with color-coded nodes:

```
                    ┌─────────────────────┐
                    │    Organization     │  (Gray - Root)
                    │      (Root)         │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐    ┌────────▼────────┐    ┌───────▼────────┐
│   Department   │    │   Department    │    │   Department   │  (Blue/Purple)
│   Engineering  │    │  Quality Assur. │    │    Finance     │  with 👔 if has manager
│   👔 John Doe  │    │   👔 Jane Smith │    │   (No Manager) │
└───────┬────────┘    └────────┬────────┘    └───────┬────────┘
        │                      │                      │
    ┌───┴───┐              ┌───┴───┐              ┌───┴───┐
    │       │              │       │              │       │
┌───▼──┐ ┌─▼────┐     ┌───▼──┐ ┌─▼────┐     ┌───▼──┐ ┌─▼────┐
│Process│ │Process│   │Process│ │Process│   │Process│ │Process│  (Green)
│Design │ │Review │   │Audit  │ │Test   │   │Budget │ │Report │
│ Proc. │ │ Proc. │   │ Proc. │ │ Proc. │   │ Proc. │ │ Proc. │
└───┬───┘ └─┬────┘     └───┬───┘ └─┬────┘     └───┬───┘ └─┬────┘
    │       │              │       │              │       │
┌───▼───┐ ┌─▼────┐     ┌───▼───┐ ┌─▼────┐     ┌───▼───┐ ┌─▼────┐
│⭐User │ │ User │     │⭐User │ │ User │     │⭐User │ │ User │  (Red/Orange)
│Primary│ │Backup│     │Primary│ │Backup│     │Primary│ │Backup│  ⭐ = Primary Owner
│Owner  │ │Owner │     │Owner  │ │Owner │     │Owner  │ │Owner │
└───────┘ └──────┘     └───────┘ └──────┘     └───────┘ └──────┘
```

### Node Color Legend

| Color | Type | Description |
|-------|------|-------------|
| 🔵 **Blue/Purple** | Department | Organizational departments with optional manager (👔 icon) |
| 🟢 **Green** | Process | Business processes within departments |
| 🔴 **Red** | User | Regular process owner |
| 🟠 **Orange** | Primary User | Primary process owner (marked with ⭐) |
| ⚫ **Gray** | Root | Organization root node |

## For All Users (View Mode)

### Features Available

1. **View Complete Hierarchy**
   - See all departments, processes, and assigned users
   - Understand reporting relationships
   - Identify process owners

2. **Navigate the Chart**
   - Scroll horizontally for large hierarchies
   - Click and drag to pan the view
   - Zoom browser if needed

3. **Understand Visual Indicators**
   - 👔 icon = Department has a manager
   - ⭐ badge = Primary process owner
   - No badge = Secondary/backup owner

4. **Refresh Data**
   - Click **"Refresh"** button to reload latest changes
   - Updates automatically reflect recent edits

### Example View Mode Screen

```
┌────────────────────────────────────────────────────────────────────┐
│ Organizational Chart                                    [Refresh]  │
│ View and manage your organizational structure                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Legend:  🔵 Department   🟢 Process   🔴 User                     │
│                                                                    │
│                    [Organization Root]                             │
│                           │                                        │
│         ┌─────────────────┼─────────────────┐                     │
│         │                 │                 │                     │
│    [Engineering]    [Quality Assur.]   [Finance]                  │
│    👔 John Doe      👔 Jane Smith      (No Manager)              │
│         │                 │                 │                     │
│      [Design]          [Audit]          [Budget]                  │
│         │                 │                 │                     │
│   [⭐Mike Chen]     [⭐Sarah Jones]   [⭐Tom Wilson]              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## For Administrators (Edit Mode)

### Enabling Edit Mode

1. Click the **"Edit Mode"** button in the top right
2. A yellow information banner appears
3. Action buttons appear on each node
4. Drag-and-drop becomes enabled

### Example Edit Mode Screen

```
┌────────────────────────────────────────────────────────────────────┐
│ Organizational Chart                    [Exit Edit] [Refresh]     │
│ View and manage your organizational structure                     │
├────────────────────────────────────────────────────────────────────┤
│ ⚠️ Edit Mode Active: Click on any department or process to edit   │
│ its details. Use the buttons to manage the chart.                 │
├────────────────────────────────────────────────────────────────────┤
│ [Add Department] [Add Process]                                    │
│                                                                    │
│ Legend:  🔵 Department   🟢 Process   🔴 User                     │
│                                                                    │
│                    [Organization Root]                             │
│                           │                                        │
│         ┌─────────────────┼─────────────────┐                     │
│    [Engineering] [✏️] [Quality] [✏️]  [Finance] [✏️]             │
│         │                 │                 │                     │
│      [Design] [✏️][👥]  [Audit] [✏️][👥]  [Budget] [✏️][👥]     │
│         │                 │                 │                     │
│   [⭐Mike] [❌]      [⭐Sarah] [❌]    [⭐Tom] [❌]                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Button Legend:
✏️ = Edit    👥 = Assign Users    ❌ = Remove
```

### Edit Mode Features

#### 1. Drag-and-Drop Process Reorganization

**How to Move a Process:**
1. Click and hold on a process node (green box)
2. Drag it over a different department node (blue box)
3. The department will highlight when it's a valid drop target
4. Release to drop the process into the new department
5. A confirmation toast appears
6. The chart refreshes automatically

**Visual Feedback:**
- Dragging process: Node becomes semi-transparent (50% opacity)
- Valid drop target: Department border turns green and glows
- Invalid drop: No visual feedback, drop is ignored
- Success: Green toast notification appears

**Example:**
```
Before:
  [Engineering Dept]
      │
   [Design Process]  ← Drag this

  [Quality Dept]     ← Drop here
      │
   [Audit Process]

After:
  [Engineering Dept]
      │
   (empty)

  [Quality Dept]
      │
   ├─[Audit Process]
   └─[Design Process]  ← Now here!
```

#### 2. Edit Department

**Steps:**
1. Click the **✏️ Edit** button on any department node
2. A modal dialog opens with the current values
3. Modify any fields:
   - **Name**: Full department name
   - **Code**: Short department code (e.g., "ENG", "QA")
   - **Description**: Optional detailed description
   - **Manager**: Select from user dropdown
4. Click **"Save Changes"**
5. Modal closes and chart refreshes

**Example Modal:**
```
┌──────────────────────────────────────────┐
│ Edit Department                      [×] │
├──────────────────────────────────────────┤
│ Name:                                    │
│ [Engineering Department____________]     │
│                                          │
│ Code:                                    │
│ [ENG__]                                  │
│                                          │
│ Description:                             │
│ [Handles all engineering processes___]   │
│ [___________________________________]    │
│                                          │
│ Manager:                                 │
│ [▼ John Doe (john@example.com)____]     │
│                                          │
├──────────────────────────────────────────┤
│              [Cancel]  [Save Changes]    │
└──────────────────────────────────────────┘
```

#### 3. Edit Process

**Steps:**
1. Click the **✏️ Edit** button on any process node
2. A modal dialog opens with the current values
3. Modify any fields:
   - **Name**: Full process name
   - **Code**: Short process code (e.g., "PROC-001")
   - **Description**: Detailed description
   - **Department**: Assign to a department (or leave unassigned)
   - **Category**: Select Core/Management/Support
4. Click **"Save Changes"**
5. Modal closes and chart refreshes

**Example Modal:**
```
┌──────────────────────────────────────────┐
│ Edit Process                         [×] │
├──────────────────────────────────────────┤
│ Name:                                    │
│ [Design Review Process____________]      │
│                                          │
│ Code:                                    │
│ [PROC-001__]                             │
│                                          │
│ Description:                             │
│ [Review all design documents for____]    │
│ [compliance and quality_____________]    │
│                                          │
│ Department:                              │
│ [▼ Engineering Department_________]      │
│                                          │
│ Category:                                │
│ [▼ Core________________________]         │
│    - Core                                │
│    - Management                          │
│    - Support                             │
│                                          │
├──────────────────────────────────────────┤
│              [Cancel]  [Save Changes]    │
└──────────────────────────────────────────┘
```

#### 4. Assign Users to Process

**Steps:**
1. Click the **👥 Assign Users** button on any process node
2. A modal opens showing current owners and assignment form
3. To assign a new owner:
   - Select user from dropdown
   - Check "Primary Owner" if this is the main responsible person
   - Add optional notes
   - Click **"Assign"**
4. To remove an owner:
   - Click **"Remove"** next to their name
   - Confirm in the dialog
5. Click **"Close"** when done

**Example Modal:**
```
┌──────────────────────────────────────────────────────────────┐
│ Assign Users to Process: Design Review             [×]      │
├──────────────────────────────────────────────────────────────┤
│ Current Owners:                                              │
│                                                              │
│ ┌──────────────────────────────────────────────────┐       │
│ │ ⭐ Mike Chen (mike@example.com)      [Remove]    │       │
│ │    Primary Owner                                 │       │
│ │    Assigned: 2024-11-15                         │       │
│ │    Notes: Lead engineer                         │       │
│ ├──────────────────────────────────────────────────┤       │
│ │ Sarah Lee (sarah@example.com)         [Remove]  │       │
│ │    Assigned: 2024-11-16                         │       │
│ │    Notes: Backup reviewer                       │       │
│ └──────────────────────────────────────────────────┘       │
│                                                              │
│ Assign New Owner:                                           │
│                                                              │
│ Select User:                                                │
│ [▼ Choose a user..._________________________]               │
│                                                              │
│ ☐ Primary Owner                                             │
│                                                              │
│ Notes (optional):                                           │
│ [_____________________________________________]              │
│ [_____________________________________________]              │
│                                                              │
│                                [Assign]                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                             [Close]         │
└──────────────────────────────────────────────────────────────┘
```

#### 5. Add New Department

**Steps:**
1. Click **"Add Department"** button at the top
2. Fill in the form:
   - **Name**: Required, must be unique
   - **Code**: Required, must be unique (e.g., "ENG", "QA")
   - **Description**: Optional
   - **Manager**: Optional, select from users
3. Click **"Create Department"**
4. New department appears in the chart

**Example Modal:**
```
┌──────────────────────────────────────────┐
│ Add New Department                   [×] │
├──────────────────────────────────────────┤
│ Name: *                                  │
│ [Human Resources__________________]      │
│                                          │
│ Code: *                                  │
│ [HR____]                                 │
│                                          │
│ Description:                             │
│ [Manages employee relations and_____]    │
│ [development_______________________]     │
│                                          │
│ Manager:                                 │
│ [▼ Select manager (optional)______]      │
│                                          │
│ * Required fields                        │
├──────────────────────────────────────────┤
│              [Cancel]  [Create Department]│
└──────────────────────────────────────────┘
```

#### 6. Add New Process

**Steps:**
1. Click **"Add Process"** button at the top
2. Fill in the form:
   - **Name**: Required, must be unique
   - **Code**: Required, must be unique (e.g., "PROC-042")
   - **Description**: Optional
   - **Department**: Optional, select to assign
   - **Category**: Select Core/Management/Support
3. Click **"Create Process"**
4. New process appears in the chart (under department or in unassigned section)

**Example Modal:**
```
┌──────────────────────────────────────────┐
│ Add New Process                      [×] │
├──────────────────────────────────────────┤
│ Name: *                                  │
│ [Employee Onboarding Process______]      │
│                                          │
│ Code: *                                  │
│ [PROC-042__]                             │
│                                          │
│ Description:                             │
│ [Standard process for onboarding new]    │
│ [employees_________________________]     │
│                                          │
│ Department:                              │
│ [▼ Human Resources_______________]       │
│                                          │
│ Category:                                │
│ [▼ Support____________________]          │
│    - Core                                │
│    - Management                          │
│    - Support                             │
│                                          │
│ * Required fields                        │
├──────────────────────────────────────────┤
│              [Cancel]  [Create Process]  │
└──────────────────────────────────────────┘
```

## Common Workflows

### Workflow 1: Reorganizing a Department

**Scenario**: Move all QA processes from Engineering to new Quality Assurance department

1. Click **"Edit Mode"**
2. Click **"Add Department"**
3. Create "Quality Assurance" department
4. Drag each QA process from Engineering to Quality Assurance
5. Click **"Exit Edit Mode"**

### Workflow 2: Assigning a New Process Owner

**Scenario**: Assign backup owner to critical process

1. Navigate to the process in the chart
2. Click **"Edit Mode"** (if not already in edit mode)
3. Click **👥 Assign Users** on the process
4. Select new user from dropdown
5. Leave "Primary Owner" unchecked (for backup)
6. Add notes: "Backup contact for this process"
7. Click **"Assign"**
8. Click **"Close"**

### Workflow 3: Setting Up a New Department Structure

**Scenario**: Create new department with processes and owners

1. Click **"Edit Mode"**
2. Click **"Add Department"**
   - Enter name: "Customer Support"
   - Enter code: "CS"
   - Select manager
   - Click **"Create Department"**
3. Click **"Add Process"**
   - Enter name: "Customer Issue Resolution"
   - Enter code: "PROC-CS-001"
   - Select department: "Customer Support"
   - Select category: "Core"
   - Click **"Create Process"**
4. Click **👥 Assign Users** on the new process
   - Assign primary owner
   - Assign backup owner
   - Click **"Close"**
5. Repeat steps 3-4 for additional processes
6. Click **"Exit Edit Mode"**

## Tips & Best Practices

### For Efficient Chart Management

1. **Use Descriptive Codes**: Keep department codes short (2-4 chars) and process codes structured (e.g., DEPT-###)

2. **Maintain Process Hierarchy**: Use the departmentId to keep related processes together

3. **Always Assign Primary Owners**: Every process should have at least one primary owner for accountability

4. **Regular Reviews**: Periodically review the chart to ensure it reflects current structure

5. **Document Changes**: Use the notes field when assigning owners to document reasoning

### For Better Visualization

1. **Limit Department Size**: If a department has too many processes, consider creating sub-departments

2. **Consistent Naming**: Use consistent naming conventions across departments and processes

3. **Manager Assignment**: Always assign managers to departments for clear responsibility chains

4. **Color Reference**: Keep the legend visible for new users to understand the color scheme

## Troubleshooting

### Chart Not Loading

**Problem**: "Failed to load organizational chart" error

**Solutions**:
1. Check your internet connection
2. Verify you're logged in (token hasn't expired)
3. Try clicking "Refresh"
4. Check with admin if backend is running

### Cannot Edit Chart

**Problem**: "Edit Mode" button not visible

**Solutions**:
1. Verify you have admin or superuser role
2. Log out and log back in
3. Contact system administrator to update your permissions

### Drag-and-Drop Not Working

**Problem**: Cannot drag processes between departments

**Solutions**:
1. Ensure you're in Edit Mode
2. Check your browser supports HTML5 drag-and-drop (all modern browsers do)
3. Try using the Edit modal instead as an alternative
4. Refresh the page and try again

### Changes Not Saving

**Problem**: Edits don't persist after save

**Solutions**:
1. Check for error toast notifications
2. Verify all required fields are filled
3. Check for duplicate codes/names
4. Refresh and try again
5. Contact system administrator if problem persists

### Chart Looks Compressed

**Problem**: Chart is too small or elements overlap

**Solutions**:
1. Use horizontal scrolling to view entire chart
2. Zoom out in your browser (Ctrl/Cmd + -)
3. Use a larger screen if possible
4. Collapse browser bookmarks/toolbars for more space

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close any open modal |
| `Ctrl/Cmd + R` | Refresh page (reloads chart) |
| `Ctrl/Cmd + -` | Zoom out (helps view large charts) |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + 0` | Reset zoom |

## Accessibility

The organizational chart is designed to be accessible:

- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Focus Indicators**: Clear focus outlines on all interactive elements

## Data Privacy & Security

### What Data Is Displayed

- Department names and codes
- Process names and codes
- User names and email addresses (for managers and process owners)
- Assignment dates and notes

### Who Can See What

- **All Users**: Can view the complete organizational chart
- **Admins Only**: Can edit departments, processes, and assignments

### Audit Trail

All changes made through the organizational chart are logged in the system's audit log:
- What was changed
- Who made the change
- When the change was made
- Old and new values

## Integration with Other Modules

The organizational chart integrates with:

- **Departments Module**: Edit departments directly or via chart
- **Processes Module**: Edit processes directly or via chart  
- **Users Module**: Assigns users as managers or process owners
- **Audit Logs**: All changes are audited
- **Process Management**: Links to process overview and details

## Support

For additional help:

1. Check the main E-QMS documentation
2. Contact your system administrator
3. Review the implementation documentation: `ORGANIZATIONAL_CHART_IMPLEMENTATION_COMPLETE.md`
4. Check the enhancement summary: `ORGANIZATIONAL_CHART_ENHANCEMENT_SUMMARY.md`

## Version Information

- **Feature Version**: 1.0.0
- **Release Date**: 2025-11-19
- **Compatible with**: E-QMS v1.0.0+
- **Dependencies**: react-organizational-chart v2.2.1, styled-components v6.1.13

---

**Questions?** Contact your E-QMS administrator or consult the technical documentation.
