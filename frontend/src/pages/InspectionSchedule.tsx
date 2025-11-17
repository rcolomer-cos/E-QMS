import { useState, useEffect } from 'react';
import {
  getInspectionPlans,
  getUpcomingInspections,
  getOverdueInspections,
  getInspectionTypes,
  InspectionPlan,
  InspectionPlanFilters,
} from '../services/inspectionPlanService';
import { getUsers } from '../services/userService';
import { User } from '../types';
import '../styles/InspectionSchedule.css';

type ViewMode = 'list' | 'calendar';

function InspectionSchedule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data
  const [upcomingInspections, setUpcomingInspections] = useState<InspectionPlan[]>([]);
  const [overdueInspections, setOverdueInspections] = useState<InspectionPlan[]>([]);
  const [allInspections, setAllInspections] = useState<InspectionPlan[]>([]);
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [inspectionTypes, setInspectionTypes] = useState<string[]>([]);
  
  // Filters
  const [filters, setFilters] = useState<InspectionPlanFilters>({
    status: 'active',
    page: 1,
    limit: 100,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspector, setSelectedInspector] = useState<number | undefined>();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarInspections, setCalendarInspections] = useState<InspectionPlan[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [viewMode, currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [upcoming, overdue, allData, usersData, types] = await Promise.all([
        getUpcomingInspections(30),
        getOverdueInspections(),
        getInspectionPlans(filters),
        getUsers(),
        getInspectionTypes(),
      ]);
      
      setUpcomingInspections(upcoming);
      setOverdueInspections(overdue);
      setAllInspections(allData.data);
      setInspectors(usersData.filter((u) => ['Admin', 'Manager', 'Auditor'].includes(u.role)));
      setInspectionTypes(types);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inspection schedule');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await getInspectionPlans({
        status: 'active',
        dueDateFrom: startOfMonth.toISOString(),
        dueDateTo: endOfMonth.toISOString(),
        limit: 500,
      });
      
      setCalendarInspections(response.data);
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
    }
  };

  const getFilteredInspections = () => {
    let filtered = [...allInspections];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inspection) =>
          inspection.planName?.toLowerCase().includes(term) ||
          inspection.planNumber?.toLowerCase().includes(term) ||
          inspection.equipmentName?.toLowerCase().includes(term) ||
          inspection.equipmentNumber?.toLowerCase().includes(term) ||
          inspection.inspectionType?.toLowerCase().includes(term)
      );
    }
    
    if (selectedInspector) {
      filtered = filtered.filter(
        (i) => i.responsibleInspectorId === selectedInspector || i.backupInspectorId === selectedInspector
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter((i) => i.inspectionType === selectedType);
    }
    
    if (selectedPriority) {
      filtered = filtered.filter((i) => i.priority === selectedPriority);
    }
    
    return filtered;
  };

  const handleFilterChange = (key: keyof InspectionPlanFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'badge badge-danger';
      case 'high':
        return 'badge badge-warning';
      case 'normal':
        return 'badge badge-info';
      case 'low':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge badge-success';
      case 'inactive':
        return 'badge badge-secondary';
      case 'on_hold':
        return 'badge badge-warning';
      case 'completed':
        return 'badge badge-info';
      case 'cancelled':
        return 'badge badge-danger';
      default:
        return 'badge';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayInspections = calendarInspections.filter((inspection) => {
        const inspectionDate = new Date(inspection.nextDueDate).toISOString().split('T')[0];
        return inspectionDate === dateStr;
      });

      const isToday = new Date().toDateString() === currentDate.toDateString();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${dayInspections.length > 0 ? 'has-inspections' : ''}`}
        >
          <div className="calendar-day-number">{day}</div>
          <div className="calendar-day-inspections">
            {dayInspections.slice(0, 3).map((inspection, idx) => (
              <div
                key={idx}
                className={`calendar-inspection ${getPriorityBadgeClass(inspection.priority)}`}
                title={`${inspection.planName} - ${inspection.equipmentName}`}
                onClick={() => handleInspectionClick(inspection)}
              >
                <span className="inspection-time">{inspection.equipmentName}</span>
              </div>
            ))}
            {dayInspections.length > 3 && (
              <div className="calendar-more">+{dayInspections.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleInspectionClick = (inspection: InspectionPlan) => {
    // Navigate to inspection plan detail or show modal
    console.log('Inspection clicked:', inspection);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="inspection-schedule-page">
        <div className="loading">Loading inspection schedule...</div>
      </div>
    );
  }

  const filteredInspections = getFilteredInspections();

  return (
    <div className="inspection-schedule-page">
      <div className="page-header">
        <h1>Inspection Schedule</h1>
        <p className="page-description">
          Manage and monitor equipment inspection schedules, assignments, and due dates
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card overdue">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <div className="card-value">{overdueInspections.length}</div>
            <div className="card-label">Overdue Inspections</div>
          </div>
        </div>
        <div className="summary-card upcoming">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">{upcomingInspections.length}</div>
            <div className="card-label">Upcoming (30 days)</div>
          </div>
        </div>
        <div className="summary-card total">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <div className="card-value">{allInspections.length}</div>
            <div className="card-label">Active Plans</div>
          </div>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="controls-section">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          <button
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar View
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search plans, equipment, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Inspection Types</option>
            {inspectionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedInspector || ''}
            onChange={(e) => setSelectedInspector(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">All Inspectors</option>
            {inspectors.map((inspector) => (
              <option key={inspector.id} value={inspector.id}>
                {inspector.username}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            className="filter-select"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={previousMonth}>
              ← Previous
            </button>
            <h2>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="calendar-nav-btn" onClick={nextMonth}>
              Next →
            </button>
          </div>
          <div className="calendar-weekdays">
            <div className="calendar-weekday">Sun</div>
            <div className="calendar-weekday">Mon</div>
            <div className="calendar-weekday">Tue</div>
            <div className="calendar-weekday">Wed</div>
            <div className="calendar-weekday">Thu</div>
            <div className="calendar-weekday">Fri</div>
            <div className="calendar-weekday">Sat</div>
          </div>
          <div className="calendar-grid">{renderCalendarView()}</div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Overdue Section */}
          {overdueInspections.length > 0 && (
            <div className="section overdue-section">
              <h2 className="section-title">⚠️ Overdue Inspections</h2>
              <div className="table-container">
                <table className="inspections-table">
                  <thead>
                    <tr>
                      <th>Plan Number</th>
                      <th>Equipment</th>
                      <th>Inspection Type</th>
                      <th>Inspector</th>
                      <th>Due Date</th>
                      <th>Days Overdue</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInspections.map((inspection) => (
                      <tr key={inspection.id} className="overdue-row">
                        <td>
                          <strong>{inspection.planNumber}</strong>
                        </td>
                        <td>
                          <div className="equipment-info">
                            <div>{inspection.equipmentName}</div>
                            <div className="equipment-number">{inspection.equipmentNumber}</div>
                          </div>
                        </td>
                        <td>{inspection.inspectionType}</td>
                        <td>{inspection.responsibleInspectorName}</td>
                        <td>{formatDate(inspection.nextDueDate)}</td>
                        <td>
                          <span className="days-overdue">
                            {inspection.daysOverdue || Math.abs(getDaysUntil(inspection.nextDueDate))} days
                          </span>
                        </td>
                        <td>
                          <span className={getPriorityBadgeClass(inspection.priority)}>
                            {inspection.priority}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(inspection.status)}>
                            {inspection.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingInspections.length > 0 && (
            <div className="section upcoming-section">
              <h2 className="section-title">📅 Upcoming Inspections (Next 30 Days)</h2>
              <div className="table-container">
                <table className="inspections-table">
                  <thead>
                    <tr>
                      <th>Plan Number</th>
                      <th>Plan Name</th>
                      <th>Equipment</th>
                      <th>Inspection Type</th>
                      <th>Inspector</th>
                      <th>Due Date</th>
                      <th>Days Until Due</th>
                      <th>Priority</th>
                      <th>Estimated Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingInspections.map((inspection) => {
                      const daysUntil = getDaysUntil(inspection.nextDueDate);
                      return (
                        <tr key={inspection.id}>
                          <td>
                            <strong>{inspection.planNumber}</strong>
                          </td>
                          <td>{inspection.planName}</td>
                          <td>
                            <div className="equipment-info">
                              <div>{inspection.equipmentName}</div>
                              <div className="equipment-number">{inspection.equipmentNumber}</div>
                            </div>
                          </td>
                          <td>{inspection.inspectionType}</td>
                          <td>
                            <div className="inspector-info">
                              <div>{inspection.responsibleInspectorName}</div>
                              {inspection.backupInspectorName && (
                                <div className="backup-inspector">
                                  Backup: {inspection.backupInspectorName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{formatDate(inspection.nextDueDate)}</td>
                          <td>
                            <span className={`days-until ${daysUntil <= 7 ? 'urgent' : ''}`}>
                              {daysUntil} days
                            </span>
                          </td>
                          <td>
                            <span className={getPriorityBadgeClass(inspection.priority)}>
                              {inspection.priority}
                            </span>
                          </td>
                          <td>{inspection.estimatedDuration ? `${inspection.estimatedDuration} min` : 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Inspections Section */}
          <div className="section all-inspections-section">
            <h2 className="section-title">📋 All Inspection Plans ({filteredInspections.length})</h2>
            <div className="table-container">
              <table className="inspections-table">
                <thead>
                  <tr>
                    <th>Plan Number</th>
                    <th>Plan Name</th>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Frequency</th>
                    <th>Inspector</th>
                    <th>Next Due</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="no-data">
                        No inspection plans found
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((inspection) => (
                      <tr key={inspection.id}>
                        <td>
                          <strong>{inspection.planNumber}</strong>
                        </td>
                        <td>{inspection.planName}</td>
                        <td>
                          <div className="equipment-info">
                            <div>{inspection.equipmentName}</div>
                            <div className="equipment-number">{inspection.equipmentNumber}</div>
                          </div>
                        </td>
                        <td>{inspection.inspectionType}</td>
                        <td>
                          {inspection.planType === 'recurring'
                            ? inspection.frequency || 'N/A'
                            : 'One-time'}
                        </td>
                        <td>{inspection.responsibleInspectorName}</td>
                        <td>{formatDate(inspection.nextDueDate)}</td>
                        <td>
                          <span className={getPriorityBadgeClass(inspection.priority)}>
                            {inspection.priority}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(inspection.status)}>
                            {inspection.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InspectionSchedule;
