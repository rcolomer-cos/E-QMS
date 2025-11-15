import { getConnection, sql } from '../config/database';
import { TrainingStatus } from '../types';

export interface Training {
  id?: number;
  trainingNumber: string;
  title: string;
  description?: string;
  category: string;
  duration?: number;
  instructor?: string;
  status: TrainingStatus;
  scheduledDate: Date;
  completedDate?: Date;
  expiryMonths?: number;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrainingAttendee {
  id?: number;
  trainingId: number;
  userId: number;
  attended: boolean;
  score?: number;
  certificateIssued?: boolean;
  certificateDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export class TrainingModel {
  static async create(training: Training): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('trainingNumber', sql.NVarChar, training.trainingNumber)
      .input('title', sql.NVarChar, training.title)
      .input('description', sql.NVarChar, training.description)
      .input('category', sql.NVarChar, training.category)
      .input('duration', sql.Int, training.duration)
      .input('instructor', sql.NVarChar, training.instructor)
      .input('status', sql.NVarChar, training.status)
      .input('scheduledDate', sql.DateTime, training.scheduledDate)
      .input('expiryMonths', sql.Int, training.expiryMonths)
      .input('createdBy', sql.Int, training.createdBy)
      .query(`
        INSERT INTO Trainings (trainingNumber, title, description, category, duration, instructor, status, scheduledDate, expiryMonths, createdBy)
        OUTPUT INSERTED.id
        VALUES (@trainingNumber, @title, @description, @category, @duration, @instructor, @status, @scheduledDate, @expiryMonths, @createdBy)
      `);

    return result.recordset[0].id;
  }

  static async findById(id: number): Promise<Training | null> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Trainings WHERE id = @id');

    return result.recordset[0] || null;
  }

  static async findAll(filters?: { status?: TrainingStatus; category?: string }): Promise<Training[]> {
    const pool = await getConnection();
    const request = pool.request();
    let query = 'SELECT * FROM Trainings WHERE 1=1';

    if (filters?.status) {
      request.input('status', sql.NVarChar, filters.status);
      query += ' AND status = @status';
    }
    if (filters?.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND category = @category';
    }

    query += ' ORDER BY scheduledDate DESC';

    const result = await request.query(query);
    return result.recordset;
  }

  static async update(id: number, updates: Partial<Training>): Promise<void> {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.Int, id);

    const fields: string[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        request.input(key, value);
        fields.push(`${key} = @${key}`);
      }
    });

    if (fields.length > 0) {
      fields.push('updatedAt = GETDATE()');
      await request.query(`UPDATE Trainings SET ${fields.join(', ')} WHERE id = @id`);
    }
  }

  static async addAttendee(attendee: TrainingAttendee): Promise<number> {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('trainingId', sql.Int, attendee.trainingId)
      .input('userId', sql.Int, attendee.userId)
      .input('attended', sql.Bit, attendee.attended)
      .input('score', sql.Decimal, attendee.score)
      .input('certificateIssued', sql.Bit, attendee.certificateIssued)
      .input('certificateDate', sql.DateTime, attendee.certificateDate)
      .input('expiryDate', sql.DateTime, attendee.expiryDate)
      .input('notes', sql.NVarChar, attendee.notes)
      .query(`
        INSERT INTO TrainingAttendees (trainingId, userId, attended, score, certificateIssued, certificateDate, expiryDate, notes)
        OUTPUT INSERTED.id
        VALUES (@trainingId, @userId, @attended, @score, @certificateIssued, @certificateDate, @expiryDate, @notes)
      `);

    return result.recordset[0].id;
  }

  static async getAttendees(trainingId: number): Promise<TrainingAttendee[]> {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('trainingId', sql.Int, trainingId)
      .query('SELECT * FROM TrainingAttendees WHERE trainingId = @trainingId');

    return result.recordset;
  }
}
