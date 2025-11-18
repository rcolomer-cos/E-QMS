import { useState, useEffect } from 'react';
import implementationTaskService, { ImplementationTask, ImplementationTaskStatistics } from '../services/implementationTaskService';
import { useAuth } from '../services/authService';
import '../styles/ImplementationTasks.css';

interface ImplementationTasksProps {
  improvementIdeaId: number;
  improvementIdeaStatus: string;
}

function ImplementationTasks({ improvementIdeaId, improvementIdeaStatus }: ImplementationTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ImplementationTask[]>([]);
  const [statistics, setStatistics] = useState<ImplementationTaskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ImplementationTask | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<ImplementationTask | null>(null);

  const [formData, setFormData] = useState({
    taskName: '',
    taskDescription: '',
    assignedTo: '',
    deadline: '',
    progressPercentage: 0,
  });

  const [completeFormData, setCompleteFormData] = useState({
    completionEvidence: '',
  });

  useEffect(() => {
    loadTasks();
    loadStatistics();
  }, [improvementIdeaId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await implementationTaskService.getTasksByImprovementIdeaId(improvementIdeaId);
      setTasks(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await implementationTaskService.getTaskStatistics(improvementIdeaId);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await implementationTaskService.createTask({
        improvementIdeaId,
        taskName: formData.taskName,
        taskDescription: formData.taskDescription || undefined,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : undefined,
        deadline: formData.deadline || undefined,
        progressPercentage: formData.progressPercentage || 0,
        status: 'pending',
        createdBy: user!.id,
      });
      setShowAddModal(false);
      resetForm();
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await implementationTaskService.updateTask(editingTask.id!, {
        taskName: formData.taskName,
        taskDescription: formData.taskDescription || undefined,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : undefined,
        deadline: formData.deadline || undefined,
        progressPercentage: formData.progressPercentage,
      });
      setEditingTask(null);
      resetForm();
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompleteModal) return;

    try {
      await implementationTaskService.completeTask(
        showCompleteModal.id!,
        completeFormData.completionEvidence || undefined
      );
      setShowCompleteModal(null);
      setCompleteFormData({ completionEvidence: '' });
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await implementationTaskService.deleteTask(taskId);
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await implementationTaskService.updateTask(taskId, { status: newStatus });
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const handleProgressChange = async (taskId: number, progressPercentage: number) => {
    try {
      await implementationTaskService.updateTask(taskId, { progressPercentage });
      loadTasks();
      loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update progress');
    }
  };

  const resetForm = () => {
    setFormData({
      taskName: '',
      taskDescription: '',
      assignedTo: '',
      deadline: '',
      progressPercentage: 0,
    });
  };

  const openEditModal = (task: ImplementationTask) => {
    setEditingTask(task);
    setFormData({
      taskName: task.taskName,
      taskDescription: task.taskDescription || '',
      assignedTo: task.assignedTo?.toString() || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      progressPercentage: task.progressPercentage,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in-progress';
      case 'blocked':
        return 'status-blocked';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocked':
        return 'Blocked';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const isOverdue = (deadline?: string, status?: string) => {
    if (!deadline || status === 'completed' || status === 'cancelled') return false;
    return new Date(deadline) < new Date();
  };

  const canManageTasks = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'user';
  const canDeleteTasks = user?.role === 'admin' || user?.role === 'manager';
  const showTaskSection = improvementIdeaStatus === 'approved' || improvementIdeaStatus === 'in_progress' || improvementIdeaStatus === 'implemented';

  if (!showTaskSection) {
    return null;
  }

  return (
    <div className="implementation-tasks-section">
      <div className="section-header">
        <h3>Implementation Tasks</h3>
        {canManageTasks && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            Add Task
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Statistics */}
      {statistics && statistics.totalTasks > 0 && (
        <div className="task-statistics">
          <div className="stat-item">
            <span className="stat-label">Total Tasks:</span>
            <span className="stat-value">{statistics.totalTasks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed:</span>
            <span className="stat-value stat-completed">{statistics.completed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">In Progress:</span>
            <span className="stat-value stat-in-progress">{statistics.inProgress}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <span className="stat-value stat-pending">{statistics.pending}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Overdue:</span>
            <span className="stat-value stat-overdue">{statistics.overdueTasks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Overall Progress:</span>
            <span className="stat-value">{Math.round(statistics.avgProgress)}%</span>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="no-tasks">No implementation tasks yet. Add tasks to track progress.</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item ${isOverdue(task.deadline, task.status) ? 'task-overdue' : ''}`}>
              <div className="task-header">
                <h4>{task.taskName}</h4>
                <span className={`task-status ${getStatusColor(task.status)}`}>
                  {getStatusDisplayName(task.status)}
                </span>
              </div>

              {task.taskDescription && (
                <p className="task-description">{task.taskDescription}</p>
              )}

              <div className="task-details">
                {task.assignedToFirstName && (
                  <div className="task-detail-item">
                    <strong>Assigned to:</strong> {task.assignedToFirstName} {task.assignedToLastName}
                  </div>
                )}
                {task.deadline && (
                  <div className="task-detail-item">
                    <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                    {isOverdue(task.deadline, task.status) && (
                      <span className="overdue-badge"> OVERDUE</span>
                    )}
                  </div>
                )}
                <div className="task-detail-item">
                  <strong>Progress:</strong>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{task.progressPercentage}%</span>
                  </div>
                </div>
              </div>

              {task.completionEvidence && (
                <div className="completion-evidence">
                  <strong>Completion Evidence:</strong>
                  <p>{task.completionEvidence}</p>
                </div>
              )}

              {canManageTasks && (
                <div className="task-actions">
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id!, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                      </select>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={task.progressPercentage}
                        onChange={(e) => handleProgressChange(task.id!, parseInt(e.target.value))}
                        className="progress-slider"
                        title={`Progress: ${task.progressPercentage}%`}
                      />
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => setShowCompleteModal(task)}
                      >
                        Complete
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(task)}
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {canDeleteTasks && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteTask(task.id!)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Implementation Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label htmlFor="taskName">Task Name *</label>
                <input
                  type="text"
                  id="taskName"
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">Assigned User ID</label>
                <input
                  type="number"
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Task</h3>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label htmlFor="editTaskName">Task Name *</label>
                <input
                  type="text"
                  id="editTaskName"
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editTaskDescription">Description</label>
                <textarea
                  id="editTaskDescription"
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editAssignedTo">Assigned User ID</label>
                <input
                  type="number"
                  id="editAssignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editDeadline">Deadline</label>
                <input
                  type="date"
                  id="editDeadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProgress">Progress: {formData.progressPercentage}%</label>
                <input
                  type="range"
                  id="editProgress"
                  min="0"
                  max="100"
                  value={formData.progressPercentage}
                  onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditingTask(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Complete Task</h3>
            <p>Mark "{showCompleteModal.taskName}" as completed?</p>
            <form onSubmit={handleCompleteTask}>
              <div className="form-group">
                <label htmlFor="completionEvidence">Completion Evidence (Optional)</label>
                <textarea
                  id="completionEvidence"
                  value={completeFormData.completionEvidence}
                  onChange={(e) => setCompleteFormData({ completionEvidence: e.target.value })}
                  rows={4}
                  placeholder="Describe what was done to complete this task..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCompleteModal(null);
                  setCompleteFormData({ completionEvidence: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Mark Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImplementationTasks;
