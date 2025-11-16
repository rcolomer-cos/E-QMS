import {
  NCRSeverity,
  NCRSource,
  NCRType,
  IMPACT_SCORES,
  getImpactScore,
  isValidSeverity,
  isValidSource,
  isValidType,
  getAllSeverities,
  getAllSources,
  getAllTypes,
} from '../../constants/ncrClassification';

describe('NCR Classification Constants', () => {
  describe('Enums', () => {
    it('should have correct severity values', () => {
      expect(NCRSeverity.MINOR).toBe('minor');
      expect(NCRSeverity.MAJOR).toBe('major');
      expect(NCRSeverity.CRITICAL).toBe('critical');
    });

    it('should have 9 source categories', () => {
      const sources = Object.values(NCRSource);
      expect(sources).toHaveLength(9);
      expect(sources).toContain('Internal Audit');
      expect(sources).toContain('Customer Complaint');
    });

    it('should have 10 type categories', () => {
      const types = Object.values(NCRType);
      expect(types).toHaveLength(10);
      expect(types).toContain('Product Quality');
      expect(types).toContain('Process Deviation');
    });
  });

  describe('Impact Scores', () => {
    it('should have correct impact scores for each severity', () => {
      expect(IMPACT_SCORES[NCRSeverity.MINOR]).toBe(1);
      expect(IMPACT_SCORES[NCRSeverity.MAJOR]).toBe(5);
      expect(IMPACT_SCORES[NCRSeverity.CRITICAL]).toBe(10);
    });

    it('should get impact score for severity', () => {
      expect(getImpactScore(NCRSeverity.MINOR)).toBe(1);
      expect(getImpactScore('major')).toBe(5);
      expect(getImpactScore('critical')).toBe(10);
      expect(getImpactScore('invalid')).toBe(0);
    });
  });

  describe('Validation Functions', () => {
    it('should validate severity levels', () => {
      expect(isValidSeverity('minor')).toBe(true);
      expect(isValidSeverity('major')).toBe(true);
      expect(isValidSeverity('critical')).toBe(true);
      expect(isValidSeverity('invalid')).toBe(false);
      expect(isValidSeverity('Medium')).toBe(false);
    });

    it('should validate source categories', () => {
      expect(isValidSource('Internal Audit')).toBe(true);
      expect(isValidSource('Customer Complaint')).toBe(true);
      expect(isValidSource('Invalid Source')).toBe(false);
    });

    it('should validate type categories', () => {
      expect(isValidType('Product Quality')).toBe(true);
      expect(isValidType('Process Deviation')).toBe(true);
      expect(isValidType('Invalid Type')).toBe(false);
    });
  });

  describe('Getter Functions', () => {
    it('should get all severities', () => {
      const severities = getAllSeverities();
      expect(severities).toHaveLength(3);
      expect(severities).toContain('minor');
      expect(severities).toContain('major');
      expect(severities).toContain('critical');
    });

    it('should get all sources', () => {
      const sources = getAllSources();
      expect(sources).toHaveLength(9);
      expect(sources).toContain('Internal Audit');
      expect(sources).toContain('External Audit');
    });

    it('should get all types', () => {
      const types = getAllTypes();
      expect(types).toHaveLength(10);
      expect(types).toContain('Product Quality');
      expect(types).toContain('Safety');
    });
  });
});
