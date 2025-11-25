import { useState, useEffect } from 'react';
import { getSkillLevels, SkillLevel } from '../services/skillLevelService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/SkillLevels.css';

function SkillLevels() {
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const toast = useToast();

  const isSuperuser = user?.role === 'superuser';

  useEffect(() => {
    loadSkillLevels();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadSkillLevels = async () => {
    try {
      setLoading(true);
      const data = await getSkillLevels();
      setSkillLevels(data.skillLevels);
    } catch (error: any) {
      console.error('Error loading skill levels:', error);
      toast.error(error.response?.data?.message || 'Failed to load skill levels');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (level: number) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  const renderCriteriaSection = (title: string, content?: string) => {
    if (!content) return null;
    return (
      <div className="criteria-section">
        <h4>{title}</h4>
        <p>{content}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="skill-levels-page">
        <div className="loading">Loading skill levels...</div>
      </div>
    );
  }

  return (
    <div className="skill-levels-page">
      <div className="page-header">
        <div>
          <h1>Skill Level Framework</h1>
          <p className="page-description">
            Organizational standards for assessing employee competency across all roles.
            Each level defines clear criteria for knowledge, skills, experience, autonomy, and complexity.
          </p>
        </div>
        {isSuperuser && (
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => toast.info('Skill level management coming soon')}
            >
              Manage Levels
            </button>
          </div>
        )}
      </div>

      <div className="skill-levels-grid">
        {skillLevels.map((level) => (
          <div
            key={level.id}
            className={`skill-level-card ${expandedLevel === level.level ? 'expanded' : ''}`}
            style={{ borderLeftColor: level.color || '#gray' }}
          >
            <div
              className="skill-level-header"
              onClick={() => toggleExpanded(level.level)}
            >
              <div className="level-icon-wrapper">
                <span className="level-icon" style={{ color: level.color }}>
                  {level.icon || '⭐'}
                </span>
                <span className="level-number">Level {level.level}</span>
              </div>
              <div className="level-title">
                <h2>{level.name}</h2>
                {level.shortName && (
                  <span className="level-short-name">{level.shortName}</span>
                )}
              </div>
              <button className="expand-button">
                {expandedLevel === level.level ? '−' : '+'}
              </button>
            </div>

            <div className="skill-level-body">
              <div className="level-description">
                <p>{level.description}</p>
              </div>

              {expandedLevel === level.level && (
                <div className="criteria-details">
                  {renderCriteriaSection('Knowledge Requirements', level.knowledgeCriteria)}
                  {renderCriteriaSection('Skills & Abilities', level.skillsCriteria)}
                  {renderCriteriaSection('Experience Expectations', level.experienceCriteria)}
                  {renderCriteriaSection('Autonomy Level', level.autonomyCriteria)}
                  {renderCriteriaSection('Task Complexity', level.complexityCriteria)}

                  {level.exampleBehaviors && (
                    <div className="criteria-section behaviors">
                      <h4>Example Observable Behaviors</h4>
                      <div className="behaviors-list">
                        {level.exampleBehaviors.split('\n').map((behavior, idx) => {
                          const trimmed = behavior.trim();
                          if (!trimmed) return null;
                          return <li key={idx}>{trimmed.replace(/^[•\-]\s*/, '')}</li>;
                        })}
                      </div>
                    </div>
                  )}

                  {level.assessmentGuidance && (
                    <div className="criteria-section guidance">
                      <h4>Assessment Guidance</h4>
                      <p className="guidance-text">{level.assessmentGuidance}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="usage-guide">
        <h3>How to Use This Framework</h3>
        <div className="usage-steps">
          <div className="usage-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Review Criteria</h4>
              <p>Familiarize yourself with the criteria for each level before conducting assessments.</p>
            </div>
          </div>
          <div className="usage-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Observe Performance</h4>
              <p>Look for evidence of behaviors and competencies that align with each level's requirements.</p>
            </div>
          </div>
          <div className="usage-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Assess Holistically</h4>
              <p>Consider all criteria dimensions (knowledge, skills, experience, autonomy, complexity) in your evaluation.</p>
            </div>
          </div>
          <div className="usage-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Document Evidence</h4>
              <p>Record specific examples and behaviors that support your assessment decision.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillLevels;
