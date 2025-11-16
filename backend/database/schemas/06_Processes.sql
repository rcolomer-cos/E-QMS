-- Processes Schema
-- Stores business processes within the quality management system
CREATE TABLE Processes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) UNIQUE NOT NULL,
    code NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(1000),
    departmentId INT,
    processCategory NVARCHAR(100),
    objective NVARCHAR(500),
    scope NVARCHAR(500),
    active BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    createdBy INT,
    CONSTRAINT FK_Processes_Department FOREIGN KEY (departmentId) REFERENCES Departments(id),
    CONSTRAINT FK_Processes_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
);
