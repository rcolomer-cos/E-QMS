import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getAttachmentsByEntity, uploadAttachment } from '../services/attachmentService';
import { Attachment } from '../services/attachmentService';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/AuditExecution.css';

interface Audit {
  id: number;
  auditNumber: string;
  title: string;
  description?: string;
  auditType: string;
  scope: string;
  status: string;
  scheduledDate: string;
  leadAuditorId: number;
  department?: string;
}

interface ChecklistTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description?: string;
  category: string;
  status: string;
}

interface ChecklistQuestion {
  id: number;
  templateId: number;
  questionNumber: string;
  questionText: string;
  category?: string;
  section?: string;
  expectedOutcome?: string;
  guidance?: string;
  questionType: 'yesno' | 'text' | 'rating' | 'checklist' | 'na';
  isMandatory: boolean;
  allowNA: boolean;
  requiresEvidence: boolean;
  minRating?: number;
  maxRating?: number;
  passingScore?: number;
  displayOrder: number;
}

interface ChecklistResponse {
  id?: number;
  auditId: number;
  templateId: number;
  questionId: number;
  responseType: 'yesno' | 'text' | 'rating' | 'na';
  yesNoResponse?: boolean;
  textResponse?: string;
  ratingResponse?: number;
  notApplicable?: boolean;
  isCompliant?: boolean;
  requiresAction?: boolean;
  findings?: string;
  evidence?: string;
  recommendations?: string;
}

interface QuestionResponse {
  id?: number;
  auditId: number;
  templateId: number;
  questionId: number;
  responseType: 'yesno' | 'text' | 'rating' | 'na';
  yesNoResponse?: boolean;
  textResponse?: string;
  ratingResponse?: number;
  notApplicable?: boolean;
  isCompliant?: boolean;
  requiresAction?: boolean;
  findings?: string;
  evidence?: string;
  recommendations?: string;
  question: ChecklistQuestion;
}

function AuditExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [audit, setAudit] = useState<Audit | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [questions, setQuestions] = useState<ChecklistQuestion[]>([]);
  const [responses, setResponses] = useState<Map<number, QuestionResponse>>(new Map());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedQuestionForUpload, setSelectedQuestionForUpload] = useState<number | null>(null);

  useEffect(() => {
    loadAuditData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedTemplate) {
      loadQuestionsAndResponses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  const loadAuditData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const auditResponse = await api.get(`/audits/${id}`);
      setAudit(auditResponse.data);

      // Load active templates
      const templatesResponse = await api.get('/checklists/templates/active');
      setTemplates(templatesResponse.data);

      // Load existing attachments
      const attachmentsData = await getAttachmentsByEntity('audit', parseInt(id, 10));
      setAttachments(attachmentsData.data);

      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsAndResponses = async () => {
    if (!selectedTemplate || !id) return;

    try {
      // Load questions for the template
      const questionsResponse = await api.get(
        `/checklists/templates/${selectedTemplate.id}/questions`
      );
      setQuestions(questionsResponse.data);

      // Load existing responses
      const responsesResponse = await api.get(
        `/checklists/audits/${id}/templates/${selectedTemplate.id}/responses`
      );

      // Map responses to questions
      const responsesMap = new Map<number, QuestionResponse>();
      responsesResponse.data.forEach((response: ChecklistResponse & { questionId: number }) => {
        const question = questionsResponse.data.find(
          (q: ChecklistQuestion) => q.id === response.questionId
        );
        if (question) {
          responsesMap.set(response.questionId, { ...response, question });
        }
      });
      setResponses(responsesMap);
    } catch (err) {
      console.error('Failed to load questions and responses:', err);
    }
  };

  const handleTemplateSelect = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setCurrentQuestionIndex(0);
  };

  const handleResponseChange = (
    questionId: number,
    field: keyof Omit<QuestionResponse, 'question'>,
    value: string | boolean | number | undefined
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Map question type to response type (checklist is treated as text)
    let responseType: 'yesno' | 'text' | 'rating' | 'na' = 'text';
    if (question.questionType === 'yesno') responseType = 'yesno';
    else if (question.questionType === 'rating') responseType = 'rating';
    else if (question.questionType === 'na') responseType = 'na';
    else if (question.questionType === 'text' || question.questionType === 'checklist') responseType = 'text';

    const currentResponse = responses.get(questionId) || {
      auditId: parseInt(id!, 10),
      templateId: selectedTemplate!.id,
      questionId,
      responseType,
      question,
      notApplicable: false,
      isCompliant: undefined,
      requiresAction: false,
    };

    const updatedResponse = { ...currentResponse, [field]: value };

    // Auto-determine compliance for yes/no questions
    if (field === 'yesNoResponse' && question.questionType === 'yesno') {
      updatedResponse.isCompliant = value === true;
    }

    // Auto-determine compliance for rating questions
    if (field === 'ratingResponse' && question.questionType === 'rating') {
      if (question.passingScore !== undefined && typeof value === 'number') {
        updatedResponse.isCompliant = value >= question.passingScore;
      }
    }

    // Set notApplicable flag
    if (field === 'notApplicable') {
      updatedResponse.notApplicable = value as boolean;
      if (value === true) {
        updatedResponse.responseType = 'na';
        updatedResponse.isCompliant = undefined;
      } else {
        // Reset to the original response type based on question type
        if (question.questionType === 'yesno') updatedResponse.responseType = 'yesno';
        else if (question.questionType === 'rating') updatedResponse.responseType = 'rating';
        else updatedResponse.responseType = 'text';
      }
    }

    setResponses(new Map(responses.set(questionId, updatedResponse)));
  };

  const saveResponse = async (questionId: number) => {
    const response = responses.get(questionId);
    if (!response) return;

    try {
      setSaving(true);
      setError('');

      // Prepare response data for API
      const { question, ...responseData } = response;

      if (response.id) {
        // Update existing response
        await api.put(`/checklists/responses/${response.id}`, responseData);
      } else {
        // Create new response
        const result = await api.post('/checklists/responses', responseData);
        response.id = result.data.responseId;
        setResponses(new Map(responses.set(questionId, response)));
      }

      setSuccessMessage('Response saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      await saveResponse(currentQuestion.id);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!selectedQuestionForUpload || !id) return;

    const response = responses.get(selectedQuestionForUpload);
    const question = questions.find((q) => q.id === selectedQuestionForUpload);

    try {
      await uploadAttachment(
        file,
        'audit',
        parseInt(id, 10),
        `Evidence for question ${question?.questionNumber}: ${question?.questionText}`,
        'audit_evidence'
      );

      // Reload attachments
      const attachmentsData = await getAttachmentsByEntity('audit', parseInt(id, 10));
      setAttachments(attachmentsData.data);

      // Update response evidence field
      if (response) {
        const evidenceNote = `Evidence uploaded: ${file.name}`;
        handleResponseChange(
          selectedQuestionForUpload,
          'evidence',
          response.evidence ? `${response.evidence}; ${evidenceNote}` : evidenceNote
        );
      }

      setShowUploadModal(false);
      setSelectedQuestionForUpload(null);
    } catch (err) {
      throw err;
    }
  };

  const getCompletionStats = () => {
    const total = questions.length;
    const answered = Array.from(responses.values()).filter(
      (r) => r.yesNoResponse !== undefined || r.textResponse || r.ratingResponse !== undefined || r.notApplicable
    ).length;
    const compliant = Array.from(responses.values()).filter((r) => r.isCompliant === true).length;
    const nonCompliant = Array.from(responses.values()).filter((r) => r.isCompliant === false).length;

    return {
      total,
      answered,
      compliant,
      nonCompliant,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  };

  const handleCompleteAudit = async () => {
    if (!audit || !id) return;

    const stats = getCompletionStats();
    if (stats.answered < stats.total) {
      if (!window.confirm(
        `Only ${stats.answered} of ${stats.total} questions have been answered. Do you want to complete the audit anyway?`
      )) {
        return;
      }
    }

    try {
      await api.put(`/audits/${id}`, {
        status: 'completed',
        completedDate: new Date().toISOString(),
      });
      navigate('/audits');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to complete audit');
    }
  };

  if (loading) {
    return <div className="loading">Loading audit...</div>;
  }

  if (!audit) {
    return <div className="error">Audit not found</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = currentQuestion ? responses.get(currentQuestion.id) : undefined;
  const stats = getCompletionStats();

  return (
    <div className="page audit-execution">
      <div className="page-header">
        <h1>Audit Execution: {audit.auditNumber}</h1>
        <div className="audit-info">
          <p><strong>Title:</strong> {audit.title}</p>
          <p><strong>Type:</strong> {audit.auditType}</p>
          <p><strong>Scheduled:</strong> {new Date(audit.scheduledDate).toLocaleDateString()}</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!selectedTemplate ? (
        <div className="template-selection">
          <h2>Select Checklist Template</h2>
          <div className="templates-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => handleTemplateSelect(template)}
              >
                <h3>{template.templateName}</h3>
                <p className="template-code">{template.templateCode}</p>
                <p className="template-category">{template.category}</p>
                {template.description && <p className="template-description">{template.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="checklist-execution">
          <div className="template-header">
            <h2>{selectedTemplate.templateName}</h2>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedTemplate(null);
                setQuestions([]);
                setResponses(new Map());
              }}
            >
              Change Template
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-stats">
              <span>Progress: {stats.answered} / {stats.total} ({stats.percentage}%)</span>
              <span className="compliant-count">✓ {stats.compliant} Compliant</span>
              <span className="non-compliant-count">✗ {stats.nonCompliant} Non-Compliant</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="question-container">
              <div className="question-header">
                <span className="question-number">{currentQuestion.questionNumber}</span>
                <h3 className="question-text">{currentQuestion.questionText}</h3>
              </div>

              {currentQuestion.category && (
                <p className="question-category"><strong>Category:</strong> {currentQuestion.category}</p>
              )}

              {currentQuestion.expectedOutcome && (
                <div className="expected-outcome">
                  <strong>Expected Outcome:</strong>
                  <p>{currentQuestion.expectedOutcome}</p>
                </div>
              )}

              {currentQuestion.guidance && (
                <div className="guidance">
                  <strong>Guidance:</strong>
                  <p>{currentQuestion.guidance}</p>
                </div>
              )}

              {/* Response Input */}
              <div className="response-section">
                {currentQuestion.allowNA && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={currentResponse?.notApplicable || false}
                      onChange={(e) =>
                        handleResponseChange(currentQuestion.id, 'notApplicable', e.target.checked)
                      }
                    />
                    <span>Not Applicable</span>
                  </label>
                )}

                {!currentResponse?.notApplicable && (
                  <>
                    {currentQuestion.questionType === 'yesno' && (
                      <div className="yesno-buttons">
                        <button
                          className={`btn-yesno ${currentResponse?.yesNoResponse === true ? 'selected compliant' : ''}`}
                          onClick={() =>
                            handleResponseChange(currentQuestion.id, 'yesNoResponse', true)
                          }
                        >
                          ✓ Yes (Compliant)
                        </button>
                        <button
                          className={`btn-yesno ${currentResponse?.yesNoResponse === false ? 'selected non-compliant' : ''}`}
                          onClick={() =>
                            handleResponseChange(currentQuestion.id, 'yesNoResponse', false)
                          }
                        >
                          ✗ No (Non-Compliant)
                        </button>
                      </div>
                    )}

                    {currentQuestion.questionType === 'text' && (
                      <textarea
                        className="response-textarea"
                        placeholder="Enter your response..."
                        value={currentResponse?.textResponse || ''}
                        onChange={(e) =>
                          handleResponseChange(currentQuestion.id, 'textResponse', e.target.value)
                        }
                        rows={4}
                      />
                    )}

                    {currentQuestion.questionType === 'rating' && (
                      <div className="rating-input">
                        <label>
                          Rating ({currentQuestion.minRating} - {currentQuestion.maxRating}
                          {currentQuestion.passingScore && `, passing: ${currentQuestion.passingScore}`}):
                        </label>
                        <input
                          type="number"
                          min={currentQuestion.minRating}
                          max={currentQuestion.maxRating}
                          value={currentResponse?.ratingResponse || ''}
                          onChange={(e) =>
                            handleResponseChange(
                              currentQuestion.id,
                              'ratingResponse',
                              parseInt(e.target.value, 10)
                            )
                          }
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Findings */}
                <div className="findings-section">
                  <label>Findings / Observations:</label>
                  <textarea
                    className="findings-textarea"
                    placeholder="Enter any findings or observations..."
                    value={currentResponse?.findings || ''}
                    onChange={(e) =>
                      handleResponseChange(currentQuestion.id, 'findings', e.target.value)
                    }
                    rows={3}
                  />
                </div>

                {/* Requires Action */}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={currentResponse?.requiresAction || false}
                    onChange={(e) =>
                      handleResponseChange(currentQuestion.id, 'requiresAction', e.target.checked)
                    }
                  />
                  <span>Requires Corrective Action</span>
                </label>

                {/* Recommendations */}
                <div className="recommendations-section">
                  <label>Recommendations:</label>
                  <textarea
                    className="recommendations-textarea"
                    placeholder="Enter recommendations..."
                    value={currentResponse?.recommendations || ''}
                    onChange={(e) =>
                      handleResponseChange(currentQuestion.id, 'recommendations', e.target.value)
                    }
                    rows={2}
                  />
                </div>

                {/* Evidence Upload */}
                {currentQuestion.requiresEvidence && (
                  <div className="evidence-section">
                    <label>Evidence Required:</label>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedQuestionForUpload(currentQuestion.id);
                        setShowUploadModal(true);
                      }}
                    >
                      📎 Upload Evidence
                    </button>
                    {currentResponse?.evidence && (
                      <p className="evidence-note">{currentResponse.evidence}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="question-navigation">
                <button
                  className="btn-secondary"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Previous
                </button>

                <button
                  className="btn-primary"
                  onClick={handleNextQuestion}
                  disabled={saving}
                >
                  {currentQuestionIndex === questions.length - 1
                    ? saving ? 'Saving...' : 'Save'
                    : saving ? 'Saving...' : 'Save & Next →'}
                </button>
              </div>

              {/* Question Progress */}
              <div className="question-progress">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          )}

          {/* Attachments Gallery */}
          {attachments.length > 0 && (
            <div className="attachments-section">
              <h3>Audit Attachments</h3>
              <AttachmentGallery
                attachments={attachments}
                onDelete={async () => {
                  const attachmentsData = await getAttachmentsByEntity('audit', parseInt(id!, 10));
                  setAttachments(attachmentsData.data);
                }}
              />
            </div>
          )}

          {/* Complete Audit Button */}
          <div className="completion-section">
            <button
              className="btn-success"
              onClick={handleCompleteAudit}
            >
              Complete Audit
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Evidence</h3>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <FileUpload
                onFileSelect={() => {}}
                onUpload={handleUploadFile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditExecution;
