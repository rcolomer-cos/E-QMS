import { Response } from 'express';
import { TrainingModel, Training } from '../models/TrainingModel';
import { AuthRequest, TrainingStatus } from '../types';
import { validationResult } from 'express-validator';

export const createTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const training: Training = req.body;

    const trainingId = await TrainingModel.create(training);

    res.status(201).json({
      message: 'Training created successfully',
      id: trainingId,
    });
  } catch (error) {
    console.error('Create Training error:', error);
    res.status(500).json({ error: 'Failed to create Training' });
  }
};

export const getTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      status: status as TrainingStatus | undefined,
      category: category as string | undefined,
    };

    const allTrainings = await TrainingModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTrainings = allTrainings.slice(startIndex, endIndex);

    res.json({
      data: paginatedTrainings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allTrainings.length,
        pages: Math.ceil(allTrainings.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Trainings error:', error);
    res.status(500).json({ error: 'Failed to get Trainings' });
  }
};

export const getTrainingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const training = await TrainingModel.findById(parseInt(id, 10));
    if (!training) {
      res.status(404).json({ error: 'Training not found' });
      return;
    }

    res.json(training);
  } catch (error) {
    console.error('Get Training error:', error);
    res.status(500).json({ error: 'Failed to get Training' });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if Training exists
    const training = await TrainingModel.findById(parseInt(id, 10));
    if (!training) {
      res.status(404).json({ error: 'Training not found' });
      return;
    }

    await TrainingModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Training updated successfully' });
  } catch (error) {
    console.error('Update Training error:', error);
    res.status(500).json({ error: 'Failed to update Training' });
  }
};

export const getTrainingAttendees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const attendees = await TrainingModel.getAttendees(parseInt(id, 10));

    res.json(attendees);
  } catch (error) {
    console.error('Get Training attendees error:', error);
    res.status(500).json({ error: 'Failed to get Training attendees' });
  }
};
