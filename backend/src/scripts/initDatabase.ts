import { getConnection, closeConnection } from '../config/database';

const createTables = async () => {
  const pool = await getConnection();

  console.log('Creating database tables...');

  // DatabaseVersion table - tracks schema versions
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
    BEGIN
      CREATE TABLE DatabaseVersion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version NVARCHAR(20) NOT NULL,
        description NVARCHAR(500) NOT NULL,
        scriptName NVARCHAR(255) NOT NULL,
        appliedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        appliedBy NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        checksum NVARCHAR(64),
        executionTimeMs INT,
        CONSTRAINT UQ_DatabaseVersion_Version UNIQUE (version)
      );
      INSERT INTO DatabaseVersion (version, description, scriptName)
      VALUES ('1.0.0', 'Initial database schema via initDatabase.ts', 'initDatabase.ts');
    END
  `);

  // Roles table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
    BEGIN
      CREATE TABLE Roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        displayName NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        isSuperUser BIT DEFAULT 0,
        permissions NVARCHAR(MAX),
        active BIT DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_Roles_Name CHECK (name IN ('superuser', 'admin', 'manager', 'auditor', 'user', 'viewer'))
      );
      
      CREATE INDEX IX_Roles_Name ON Roles(name) WHERE active = 1;
      CREATE INDEX IX_Roles_Active ON Roles(active);

      INSERT INTO Roles (name, displayName, description, isSuperUser, permissions) VALUES
      ('superuser', 'Super User', 'Full system access including user elevation to superuser', 1, '["all"]'),
      ('admin', 'Administrator', 'Full administrative access except superuser elevation', 0, '["user.manage", "role.assign", "document.approve", "audit.manage", "ncr.manage", "capa.manage", "equipment.manage", "training.manage", "settings.manage"]'),
      ('manager', 'Manager', 'Quality management and approval authority', 0, '["document.approve", "audit.conduct", "ncr.create", "capa.create", "equipment.manage", "training.manage", "reports.view"]'),
      ('auditor', 'Auditor', 'Conduct audits and create NCRs', 0, '["audit.conduct", "audit.view", "ncr.create", "ncr.view", "document.view", "reports.view"]'),
      ('user', 'User', 'Create and edit documents, view reports', 0, '["document.create", "document.edit", "document.view", "ncr.view", "audit.view", "equipment.view", "training.view", "reports.view"]'),
      ('viewer', 'Viewer', 'Read-only access to system', 0, '["document.view", "audit.view", "ncr.view", "equipment.view", "training.view", "reports.view"]');
    END
  `);

  // Users table - email as login username
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    BEGIN
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        firstName NVARCHAR(50) NOT NULL,
        lastName NVARCHAR(50) NOT NULL,
        department NVARCHAR(100),
        active BIT DEFAULT 1,
        lastLoginAt DATETIME2,
        passwordChangedAt DATETIME2,
        mustChangePassword BIT DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        createdBy INT NULL,
        CONSTRAINT CK_Users_Email CHECK (email LIKE '%@%')
      );
      
      CREATE INDEX IX_Users_Email ON Users(email) WHERE active = 1;
      CREATE INDEX IX_Users_Active ON Users(active);
      CREATE INDEX IX_Users_Department ON Users(department) WHERE active = 1;
    END
  `);

  // UserRoles junction table - many-to-many relationship
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
    BEGIN
      CREATE TABLE UserRoles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        roleId INT NOT NULL,
        assignedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        assignedBy INT NULL,
        CONSTRAINT FK_UserRoles_UserId FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_RoleId FOREIGN KEY (roleId) REFERENCES Roles(id),
        CONSTRAINT FK_UserRoles_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
        CONSTRAINT UQ_UserRoles_UserRole UNIQUE (userId, roleId)
      );
      
      CREATE INDEX IX_UserRoles_UserId ON UserRoles(userId);
      CREATE INDEX IX_UserRoles_RoleId ON UserRoles(roleId);
    END
  `);

  // Documents table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
    CREATE TABLE Documents (
      id INT IDENTITY(1,1) PRIMARY KEY,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(1000),
      documentType NVARCHAR(50) NOT NULL,
      category NVARCHAR(100) NOT NULL,
      version NVARCHAR(20) NOT NULL,
      status NVARCHAR(20) NOT NULL,
      filePath NVARCHAR(500),
      fileName NVARCHAR(255),
      fileSize INT,
      createdBy INT NOT NULL,
      approvedBy INT,
      effectiveDate DATETIME2,
      reviewDate DATETIME2,
      expiryDate DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (createdBy) REFERENCES Users(id),
      FOREIGN KEY (approvedBy) REFERENCES Users(id)
    )
  `);

  // Audits table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Audits')
    CREATE TABLE Audits (
      id INT IDENTITY(1,1) PRIMARY KEY,
      auditNumber NVARCHAR(50) UNIQUE NOT NULL,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(1000),
      auditType NVARCHAR(50) NOT NULL,
      scope NVARCHAR(500) NOT NULL,
      status NVARCHAR(20) NOT NULL,
      scheduledDate DATETIME2 NOT NULL,
      completedDate DATETIME2,
      leadAuditorId INT NOT NULL,
      department NVARCHAR(100),
      findings NVARCHAR(MAX),
      conclusions NVARCHAR(MAX),
      createdBy INT NOT NULL,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (leadAuditorId) REFERENCES Users(id),
      FOREIGN KEY (createdBy) REFERENCES Users(id)
    )
  `);

  // NCRs table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NCRs')
    CREATE TABLE NCRs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      ncrNumber NVARCHAR(50) UNIQUE NOT NULL,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(MAX) NOT NULL,
      source NVARCHAR(100) NOT NULL,
      category NVARCHAR(100) NOT NULL,
      status NVARCHAR(20) NOT NULL,
      severity NVARCHAR(20) NOT NULL,
      detectedDate DATETIME2 NOT NULL,
      reportedBy INT NOT NULL,
      assignedTo INT,
      rootCause NVARCHAR(MAX),
      containmentAction NVARCHAR(MAX),
      correctiveAction NVARCHAR(MAX),
      verifiedBy INT,
      verifiedDate DATETIME2,
      closedDate DATETIME2,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (reportedBy) REFERENCES Users(id),
      FOREIGN KEY (assignedTo) REFERENCES Users(id),
      FOREIGN KEY (verifiedBy) REFERENCES Users(id)
    )
  `);

  // CAPAs table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CAPAs')
    CREATE TABLE CAPAs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      capaNumber NVARCHAR(50) UNIQUE NOT NULL,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(MAX) NOT NULL,
      type NVARCHAR(50) NOT NULL,
      source NVARCHAR(100) NOT NULL,
      status NVARCHAR(20) NOT NULL,
      priority NVARCHAR(20) NOT NULL,
      ncrId INT,
      auditId INT,
      rootCause NVARCHAR(MAX),
      proposedAction NVARCHAR(MAX) NOT NULL,
      actionOwner INT NOT NULL,
      targetDate DATETIME2 NOT NULL,
      completedDate DATETIME2,
      effectiveness NVARCHAR(MAX),
      verifiedBy INT,
      verifiedDate DATETIME2,
      closedDate DATETIME2,
      createdBy INT NOT NULL,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (ncrId) REFERENCES NCRs(id),
      FOREIGN KEY (auditId) REFERENCES Audits(id),
      FOREIGN KEY (actionOwner) REFERENCES Users(id),
      FOREIGN KEY (verifiedBy) REFERENCES Users(id),
      FOREIGN KEY (createdBy) REFERENCES Users(id)
    )
  `);

  // Equipment table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
    CREATE TABLE Equipment (
      id INT IDENTITY(1,1) PRIMARY KEY,
      equipmentNumber NVARCHAR(50) UNIQUE NOT NULL,
      name NVARCHAR(200) NOT NULL,
      description NVARCHAR(1000),
      manufacturer NVARCHAR(100),
      model NVARCHAR(100),
      serialNumber NVARCHAR(100),
      location NVARCHAR(200) NOT NULL,
      department NVARCHAR(100),
      status NVARCHAR(20) NOT NULL,
      purchaseDate DATETIME2,
      lastCalibrationDate DATETIME2,
      nextCalibrationDate DATETIME2,
      calibrationInterval INT,
      lastMaintenanceDate DATETIME2,
      nextMaintenanceDate DATETIME2,
      maintenanceInterval INT,
      qrCode NVARCHAR(MAX),
      responsiblePerson INT,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (responsiblePerson) REFERENCES Users(id)
    )
  `);

  // Trainings table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Trainings')
    CREATE TABLE Trainings (
      id INT IDENTITY(1,1) PRIMARY KEY,
      trainingNumber NVARCHAR(50) UNIQUE NOT NULL,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(1000),
      category NVARCHAR(100) NOT NULL,
      duration INT,
      instructor NVARCHAR(100),
      status NVARCHAR(20) NOT NULL,
      scheduledDate DATETIME2 NOT NULL,
      completedDate DATETIME2,
      expiryMonths INT,
      createdBy INT NOT NULL,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (createdBy) REFERENCES Users(id)
    )
  `);

  // TrainingAttendees table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingAttendees')
    CREATE TABLE TrainingAttendees (
      id INT IDENTITY(1,1) PRIMARY KEY,
      trainingId INT NOT NULL,
      userId INT NOT NULL,
      attended BIT DEFAULT 0,
      score DECIMAL(5,2),
      certificateIssued BIT DEFAULT 0,
      certificateDate DATETIME2,
      expiryDate DATETIME2,
      notes NVARCHAR(MAX),
      FOREIGN KEY (trainingId) REFERENCES Trainings(id),
      FOREIGN KEY (userId) REFERENCES Users(id),
      UNIQUE (trainingId, userId)
    )
  `);

  // Update database version for complete initialization
  await pool.request().query(`
    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseVersion')
    BEGIN
      IF NOT EXISTS (SELECT * FROM DatabaseVersion WHERE version = '1.0.4')
      BEGIN
        INSERT INTO DatabaseVersion (version, description, scriptName)
        VALUES ('1.0.4', 'Complete database initialization with all tables', 'initDatabase.ts');
      END
    END
  `);

  console.log('Database tables created successfully!');
};

const runInit = async () => {
  try {
    await createTables();
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await closeConnection();
  }
};

runInit();
