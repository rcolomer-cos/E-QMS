-- Create company_branding table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[company_branding]') AND type in (N'U'))
BEGIN
    CREATE TABLE company_branding (
        id INT PRIMARY KEY IDENTITY(1,1),
        company_name NVARCHAR(200) NOT NULL,
        company_logo_url NVARCHAR(500),
        company_logo_path NVARCHAR(500),
        primary_color NVARCHAR(20) DEFAULT '#1976d2',
        secondary_color NVARCHAR(20) DEFAULT '#dc004e',
        company_website NVARCHAR(500),
        company_email NVARCHAR(200),
        company_phone NVARCHAR(50),
        company_address NVARCHAR(500),
        company_city NVARCHAR(100),
        company_state NVARCHAR(100),
        company_postal_code NVARCHAR(20),
        company_country NVARCHAR(100),
        tagline NVARCHAR(200),
        description NVARCHAR(1000),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    PRINT 'Table company_branding created successfully';
END
ELSE
BEGIN
    PRINT 'Table company_branding already exists';
END
GO

-- Insert default company branding record (only one record should exist)
IF NOT EXISTS (SELECT * FROM company_branding WHERE id = 1)
BEGIN
    INSERT INTO company_branding (
        company_name,
        primary_color,
        secondary_color,
        description
    )
    VALUES (
        'E-QMS',
        '#1976d2',
        '#dc004e',
        'Quality Management System'
    );

    PRINT 'Default company branding record created successfully';
END
ELSE
BEGIN
    PRINT 'Default company branding record already exists';
END
GO
