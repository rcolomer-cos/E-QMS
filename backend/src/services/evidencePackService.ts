import PDFDocument from 'pdfkit';
import { getConnection, sql } from '../config/database';

export interface EvidencePackFilters {
  startDate?: Date;
  endDate?: Date;
  includeDocuments?: boolean;
  includeNCRs?: boolean;
  includeCAPAs?: boolean;
  includeTraining?: boolean;
  includeAudits?: boolean;
  includeAttachments?: boolean;
}

export class EvidencePackService {
  /**
   * Generate a comprehensive evidence pack PDF for external auditors
   */
  static async generateEvidencePack(
    filters: EvidencePackFilters = {}
  ): Promise<Buffer> {
    // Set defaults
    const {
      startDate,
      endDate,
      includeDocuments = true,
      includeNCRs = true,
      includeCAPAs = true,
      includeTraining = true,
      includeAudits = true,
      includeAttachments = true,
    } = filters;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'QMS Evidence Pack',
        Author: 'E-QMS System',
        Subject: 'Quality Management System Evidence Pack for External Audit',
        CreationDate: new Date(),
      },
    });

    // Buffer to collect PDF data
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Add cover page
    this.addCoverPage(doc, startDate, endDate);

    // Add table of contents placeholder
    doc.addPage();
    this.addSectionHeader(doc, 'Table of Contents');
    const sections: string[] = [];

    // Add documents section
    if (includeDocuments) {
      doc.addPage();
      await this.addDocumentsSection(doc, startDate, endDate);
      sections.push('1. Documents');
    }

    // Add NCRs section
    if (includeNCRs) {
      doc.addPage();
      await this.addNCRsSection(doc, startDate, endDate);
      sections.push('2. Non-Conformance Reports');
    }

    // Add CAPAs section
    if (includeCAPAs) {
      doc.addPage();
      await this.addCAPAsSection(doc, startDate, endDate);
      sections.push('3. Corrective & Preventive Actions');
    }

    // Add training section
    if (includeTraining) {
      doc.addPage();
      await this.addTrainingSection(doc, startDate, endDate);
      sections.push('4. Training Records');
    }

    // Add audits section
    if (includeAudits) {
      doc.addPage();
      await this.addAuditsSection(doc, startDate, endDate);
      sections.push('5. Audit Records');
    }

    // Add attachments summary
    if (includeAttachments) {
      doc.addPage();
      await this.addAttachmentsSection(doc);
      sections.push('6. Attachments & Evidence');
    }

    // Add summary statistics
    doc.addPage();
    await this.addSummaryStatistics(doc);
    sections.push('7. Summary Statistics');

    // Finalize the PDF
    doc.end();

    // Return buffer when complete
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
  }

  private static addCoverPage(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): void {
    doc.fontSize(24).font('Helvetica-Bold').text('QMS Evidence Pack', {
      align: 'center',
    });

    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica').text('Quality Management System', {
      align: 'center',
    });

    doc.moveDown(1);

    doc.fontSize(14).text('Evidence Pack for External Audit', {
      align: 'center',
    });

    doc.moveDown(3);

    // Date range
    doc.fontSize(12).font('Helvetica-Bold').text('Report Period:');
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        startDate
          ? `From: ${this.formatDate(startDate)}`
          : 'From: System inception'
      );
    doc
      .text(endDate ? `To: ${this.formatDate(endDate)}` : `To: ${this.formatDate(new Date())}`);

    doc.moveDown(2);

    doc.fontSize(11).text(`Generated: ${this.formatDateTime(new Date())}`);

    doc.moveDown(4);

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text(
        'This document contains confidential information and is intended for authorized personnel only.',
        {
          align: 'center',
        }
      );
  }

  private static addSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string
  ): void {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text(title);
    doc.moveDown(0.5);
    doc
      .strokeColor('#3498db')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);
    doc.fillColor('#000000');
  }

  private static async addDocumentsSection(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    this.addSectionHeader(doc, '1. Documents');

    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM Documents WHERE 1=1';

    if (startDate) {
      query += ' AND createdAt >= @startDate';
      request.input('startDate', sql.DateTime2, startDate);
    }
    if (endDate) {
      query += ' AND createdAt <= @endDate';
      request.input('endDate', sql.DateTime2, endDate);
    }

    query += ' ORDER BY status, category, createdAt DESC';

    const result = await request.query(query);
    const documents = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total Documents: ${documents.length}`);
    doc.moveDown(1);

    // Group by status
    const byStatus = this.groupBy(documents, 'status');

    for (const [status, docs] of Object.entries(byStatus)) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Status: ${status.toUpperCase()} (${docs.length})`);
      doc.moveDown(0.5);

      docs.forEach((docItem: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`• ${docItem.title}`, { indent: 20 });
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`  Version: ${docItem.version} | Type: ${docItem.documentType} | Category: ${docItem.category}`, { indent: 25 });
        doc.text(`  Created: ${this.formatDate(docItem.createdAt)}`, { indent: 25 });
        if (docItem.approvedAt) {
          doc.text(`  Approved: ${this.formatDate(docItem.approvedAt)}`, { indent: 25 });
        }
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    }
  }

  private static async addNCRsSection(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    this.addSectionHeader(doc, '2. Non-Conformance Reports');

    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM NCRs WHERE 1=1';

    if (startDate) {
      query += ' AND detectedDate >= @startDate';
      request.input('startDate', sql.DateTime2, startDate);
    }
    if (endDate) {
      query += ' AND detectedDate <= @endDate';
      request.input('endDate', sql.DateTime2, endDate);
    }

    query += ' ORDER BY severity, status, detectedDate DESC';

    const result = await request.query(query);
    const ncrs = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total NCRs: ${ncrs.length}`);
    doc.moveDown(1);

    // Group by severity
    const bySeverity = this.groupBy(ncrs, 'severity');

    for (const [severity, items] of Object.entries(bySeverity)) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Severity: ${severity.toUpperCase()} (${items.length})`);
      doc.moveDown(0.5);

      items.forEach((ncr: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`• NCR-${ncr.ncrNumber}: ${ncr.title}`, { indent: 20 });
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`  Status: ${ncr.status} | Category: ${ncr.category} | Source: ${ncr.source}`, { indent: 25 });
        doc.text(`  Detected: ${this.formatDate(ncr.detectedDate)}`, { indent: 25 });
        if (ncr.closedDate) {
          doc.text(`  Closed: ${this.formatDate(ncr.closedDate)}`, { indent: 25 });
        }
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    }
  }

  private static async addCAPAsSection(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    this.addSectionHeader(doc, '3. Corrective & Preventive Actions');

    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM CAPAs WHERE 1=1';

    if (startDate) {
      query += ' AND createdAt >= @startDate';
      request.input('startDate', sql.DateTime2, startDate);
    }
    if (endDate) {
      query += ' AND createdAt <= @endDate';
      request.input('endDate', sql.DateTime2, endDate);
    }

    query += ' ORDER BY priority, status, targetDate';

    const result = await request.query(query);
    const capas = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total CAPAs: ${capas.length}`);
    doc.moveDown(1);

    // Group by priority
    const byPriority = this.groupBy(capas, 'priority');

    for (const [priority, items] of Object.entries(byPriority)) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Priority: ${priority.toUpperCase()} (${items.length})`);
      doc.moveDown(0.5);

      items.forEach((capa: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`• CAPA-${capa.capaNumber}: ${capa.title}`, { indent: 20 });
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`  Status: ${capa.status} | Type: ${capa.type} | Source: ${capa.source}`, { indent: 25 });
        doc.text(`  Target Date: ${this.formatDate(capa.targetDate)}`, { indent: 25 });
        if (capa.completedDate) {
          doc.text(`  Completed: ${this.formatDate(capa.completedDate)}`, { indent: 25 });
        }
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    }
  }

  private static async addTrainingSection(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    this.addSectionHeader(doc, '4. Training Records');

    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM Trainings WHERE 1=1';

    if (startDate) {
      query += ' AND scheduledDate >= @startDate';
      request.input('startDate', sql.DateTime2, startDate);
    }
    if (endDate) {
      query += ' AND scheduledDate <= @endDate';
      request.input('endDate', sql.DateTime2, endDate);
    }

    query += ' ORDER BY status, scheduledDate DESC';

    const result = await request.query(query);
    const trainings = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total Training Sessions: ${trainings.length}`);
    doc.moveDown(1);

    // Get training attendance summary
    const attendanceQuery = `
      SELECT t.id, t.trainingNumber, t.title,
             COUNT(ta.id) as totalAttendees,
             SUM(CASE WHEN ta.attended = 1 THEN 1 ELSE 0 END) as attended,
             SUM(CASE WHEN ta.certificateIssued = 1 THEN 1 ELSE 0 END) as certified
      FROM Trainings t
      LEFT JOIN TrainingAttendees ta ON t.id = ta.trainingId
      WHERE 1=1
    `;

    const attendanceResult = await pool.request().query(attendanceQuery);
    const attendanceMap = new Map(
      attendanceResult.recordset.map((r: any) => [r.id, r])
    );

    trainings.forEach((training: any) => {
      const attendance = attendanceMap.get(training.id);

      doc.fontSize(10).font('Helvetica-Bold').text(`• ${training.title} (${training.trainingNumber})`, { indent: 20 });
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`  Category: ${training.category} | Status: ${training.status}`, { indent: 25 });
      doc.text(`  Scheduled: ${this.formatDate(training.scheduledDate)}`, { indent: 25 });

      if (attendance) {
        doc.text(
          `  Attendees: ${attendance.totalAttendees || 0} | Attended: ${attendance.attended || 0} | Certified: ${attendance.certified || 0}`,
          { indent: 25 }
        );
      }

      doc.moveDown(0.3);
    });
  }

  private static async addAuditsSection(
    doc: PDFKit.PDFDocument,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    this.addSectionHeader(doc, '5. Audit Records');

    const pool = await getConnection();
    const request = pool.request();

    let query = 'SELECT * FROM Audits WHERE 1=1';

    if (startDate) {
      query += ' AND scheduledDate >= @startDate';
      request.input('startDate', sql.DateTime2, startDate);
    }
    if (endDate) {
      query += ' AND scheduledDate <= @endDate';
      request.input('endDate', sql.DateTime2, endDate);
    }

    query += ' ORDER BY auditType, status, scheduledDate DESC';

    const result = await request.query(query);
    const audits = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total Audits: ${audits.length}`);
    doc.moveDown(1);

    // Group by type
    const byType = this.groupBy(audits, 'auditType');

    for (const [type, items] of Object.entries(byType)) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Type: ${type.toUpperCase()} (${items.length})`);
      doc.moveDown(0.5);

      items.forEach((audit: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`• ${audit.auditNumber}: ${audit.title}`, { indent: 20 });
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`  Status: ${audit.status} | Scope: ${audit.scope}`, { indent: 25 });
        doc.text(`  Scheduled: ${this.formatDate(audit.scheduledDate)}`, { indent: 25 });
        if (audit.completedDate) {
          doc.text(`  Completed: ${this.formatDate(audit.completedDate)}`, { indent: 25 });
        }
        if (audit.department) {
          doc.text(`  Department: ${audit.department}`, { indent: 25 });
        }
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    }
  }

  private static async addAttachmentsSection(
    doc: PDFKit.PDFDocument
  ): Promise<void> {
    this.addSectionHeader(doc, '6. Attachments & Evidence');

    const pool = await getConnection();

    // Get attachment statistics by entity type
    const query = `
      SELECT 
        entityType,
        COUNT(*) as count,
        SUM(fileSize) as totalSize
      FROM Attachments
      WHERE active = 1
      GROUP BY entityType
      ORDER BY count DESC
    `;

    const result = await pool.request().query(query);
    const stats = result.recordset;

    doc.fontSize(12).font('Helvetica-Bold').text('Attachment Summary by Entity Type');
    doc.moveDown(1);

    stats.forEach((stat: any) => {
      const sizeMB = (stat.totalSize / (1024 * 1024)).toFixed(2);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`• ${stat.entityType}: ${stat.count} files (${sizeMB} MB)`, { indent: 20 });
    });

    doc.moveDown(1);

    const totalQuery = `
      SELECT 
        COUNT(*) as totalCount,
        SUM(fileSize) as totalSize
      FROM Attachments
      WHERE active = 1
    `;

    const totalResult = await pool.request().query(totalQuery);
    const total = totalResult.recordset[0];
    const totalSizeMB = (total.totalSize / (1024 * 1024)).toFixed(2);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total: ${total.totalCount} files (${totalSizeMB} MB)`);
  }

  private static async addSummaryStatistics(
    doc: PDFKit.PDFDocument
  ): Promise<void> {
    this.addSectionHeader(doc, '7. Summary Statistics');

    const pool = await getConnection();

    // Document statistics
    const docStats = await pool.request().query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM Documents
      GROUP BY status
    `);

    doc.fontSize(12).font('Helvetica-Bold').text('Document Status Summary');
    doc.moveDown(0.5);
    docStats.recordset.forEach((stat: any) => {
      doc.fontSize(10).font('Helvetica').text(`• ${stat.status}: ${stat.count}`, { indent: 20 });
    });
    doc.moveDown(1);

    // NCR statistics
    const ncrStats = await pool.request().query(`
      SELECT 
        status,
        severity,
        COUNT(*) as count
      FROM NCRs
      GROUP BY status, severity
      ORDER BY severity, status
    `);

    doc.fontSize(12).font('Helvetica-Bold').text('NCR Status Summary');
    doc.moveDown(0.5);
    const ncrBySeverity = this.groupBy(ncrStats.recordset, 'severity');
    for (const [severity, items] of Object.entries(ncrBySeverity)) {
      doc.fontSize(10).font('Helvetica-Bold').text(`${severity}:`, { indent: 20 });
      items.forEach((item: any) => {
        doc.fontSize(9).font('Helvetica').text(`• ${item.status}: ${item.count}`, { indent: 35 });
      });
    }
    doc.moveDown(1);

    // CAPA statistics
    const capaStats = await pool.request().query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM CAPAs
      GROUP BY status
    `);

    doc.fontSize(12).font('Helvetica-Bold').text('CAPA Status Summary');
    doc.moveDown(0.5);
    capaStats.recordset.forEach((stat: any) => {
      doc.fontSize(10).font('Helvetica').text(`• ${stat.status}: ${stat.count}`, { indent: 20 });
    });
    doc.moveDown(1);

    // Training statistics
    const trainingStats = await pool.request().query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM Trainings
      GROUP BY status
    `);

    doc.fontSize(12).font('Helvetica-Bold').text('Training Status Summary');
    doc.moveDown(0.5);
    trainingStats.recordset.forEach((stat: any) => {
      doc.fontSize(10).font('Helvetica').text(`• ${stat.status}: ${stat.count}`, { indent: 20 });
    });
  }

  // Helper methods
  private static formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
}
