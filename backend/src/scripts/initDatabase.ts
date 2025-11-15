import { getConnection, closeConnection } from '../config/database';

const createTables = async () => {
  const pool = await getConnection();

  console.log('Creating database tables...');

  // Users table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    CREATE TABLE Users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(50) UNIQUE NOT NULL,
      email NVARCHAR(100) UNIQUE NOT NULL,
      password NVARCHAR(255) NOT NULL,
      role NVARCHAR(20) NOT NULL,
      firstName NVARCHAR(50),
      lastName NVARCHAR(50),
      department NVARCHAR(100),
      active BIT DEFAULT 1,
      createdAt DATETIME2 DEFAULT GETDATE(),
      updatedAt DATETIME2 DEFAULT GETDATE()
    )
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
