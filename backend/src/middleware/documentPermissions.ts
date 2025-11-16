import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { DocumentModel, Document } from '../models/DocumentModel';

/**
 * Document permission actions that can be controlled
 */
export enum DocumentAction {
  VIEW = 'view',
  EDIT = 'edit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  DELETE = 'delete',
}

/**
 * Check if user can view a document
 * Rules:
 * - Approved documents: All authenticated users can view
 * - Draft/Review documents: Only owner, creator, managers, admins, and superusers can view
 * - Obsolete documents: Only managers, admins, and superusers can view
 */
const canViewDocument = (user: AuthRequest['user'], document: Document): boolean => {
  if (!user) return false;

  const { roles, id: userId } = user;

  // Superusers and admins can view all documents
  if (roles.includes(UserRole.SUPERUSER) || roles.includes(UserRole.ADMIN)) {
    return true;
  }

  // Managers can view all documents
  if (roles.includes(UserRole.MANAGER)) {
    return true;
  }

  // Approved documents can be viewed by all authenticated users
  if (document.status === 'approved') {
    return true;
  }

  // Owner and creator can view their own documents in any status
  if (document.ownerId === userId || document.createdBy === userId) {
    return true;
  }

  // Viewers can only see approved documents (handled above)
  return false;
};

/**
 * Check if user can edit a document
 * Rules:
 * - Superusers and admins can edit all documents
 * - Document owner and creator can edit draft and review status documents
 * - Managers can edit documents
 * - Approved and obsolete documents can only be edited by admins/superusers
 */
const canEditDocument = (user: AuthRequest['user'], document: Document): boolean => {
  if (!user) return false;

  const { roles, id: userId } = user;

  // Superusers and admins can edit all documents
  if (roles.includes(UserRole.SUPERUSER) || roles.includes(UserRole.ADMIN)) {
    return true;
  }

  // Approved and obsolete documents can only be edited by admins/superusers
  if (document.status === 'approved' || document.status === 'obsolete') {
    return false;
  }

  // Managers can edit documents in draft or review status
  if (roles.includes(UserRole.MANAGER)) {
    return true;
  }

  // Owner and creator can edit their own documents in draft or review status
  if ((document.ownerId === userId || document.createdBy === userId) && 
      (document.status === 'draft' || document.status === 'review')) {
    return true;
  }

  return false;
};

/**
 * Check if user can approve a document
 * Rules:
 * - Only managers, admins, and superusers can approve documents
 * - Document must be in 'review' status to be approved
 */
const canApproveDocument = (user: AuthRequest['user'], document: Document): boolean => {
  if (!user) return false;

  const { roles } = user;

  // Only managers, admins, and superusers can approve
  if (!roles.includes(UserRole.MANAGER) && 
      !roles.includes(UserRole.ADMIN) && 
      !roles.includes(UserRole.SUPERUSER)) {
    return false;
  }

  // Document must be in review status
  if (document.status !== 'review') {
    return false;
  }

  return true;
};

/**
 * Check if user can reject a document
 * Rules:
 * - Only managers, admins, and superusers can reject documents
 * - Document must be in 'review' status to be rejected
 */
const canRejectDocument = (user: AuthRequest['user'], document: Document): boolean => {
  if (!user) return false;

  const { roles } = user;

  // Only managers, admins, and superusers can reject
  if (!roles.includes(UserRole.MANAGER) && 
      !roles.includes(UserRole.ADMIN) && 
      !roles.includes(UserRole.SUPERUSER)) {
    return false;
  }

  // Document must be in review status
  if (document.status !== 'review') {
    return false;
  }

  return true;
};

/**
 * Check if user can request changes for a document
 * Rules:
 * - Only managers, admins, and superusers can request changes
 * - Document must be in 'review' status
 */
const canRequestChangesDocument = (user: AuthRequest['user'], document: Document): boolean => {
  if (!user) return false;

  const { roles } = user;

  // Only managers, admins, and superusers can request changes
  if (!roles.includes(UserRole.MANAGER) && 
      !roles.includes(UserRole.ADMIN) && 
      !roles.includes(UserRole.SUPERUSER)) {
    return false;
  }

  // Document must be in review status
  if (document.status !== 'review') {
    return false;
  }

  return true;
};

/**
 * Check if user can delete a document
 * Rules:
 * - Only admins and superusers can delete documents
 */
const canDeleteDocument = (user: AuthRequest['user']): boolean => {
  if (!user) return false;

  const { roles } = user;

  return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.SUPERUSER);
};

/**
 * Middleware to check document permissions
 * Retrieves the document and checks if the user has permission to perform the specified action
 */
export const checkDocumentPermission = (action: DocumentAction) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      const documentId = parseInt(id, 10);

      if (isNaN(documentId)) {
        res.status(400).json({ error: 'Invalid document ID' });
        return;
      }

      // For delete action, we don't need to fetch the document
      if (action === DocumentAction.DELETE) {
        if (canDeleteDocument(req.user)) {
          next();
          return;
        }
        res.status(403).json({ error: 'Access denied: insufficient permissions to delete document' });
        return;
      }

      // Fetch the document for other actions
      const document = await DocumentModel.findById(documentId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Store document in request for later use
      req.document = document;

      // Check permission based on action
      let hasPermission = false;
      let errorMessage = '';

      switch (action) {
        case DocumentAction.VIEW:
          hasPermission = canViewDocument(req.user, document);
          errorMessage = 'Access denied: insufficient permissions to view this document';
          break;
        case DocumentAction.EDIT:
          hasPermission = canEditDocument(req.user, document);
          errorMessage = 'Access denied: insufficient permissions to edit this document';
          break;
        case DocumentAction.APPROVE:
          hasPermission = canApproveDocument(req.user, document);
          errorMessage = 'Access denied: insufficient permissions to approve this document';
          break;
        case DocumentAction.REJECT:
          hasPermission = canRejectDocument(req.user, document);
          errorMessage = 'Access denied: insufficient permissions to reject this document';
          break;
        case DocumentAction.REQUEST_CHANGES:
          hasPermission = canRequestChangesDocument(req.user, document);
          errorMessage = 'Access denied: insufficient permissions to request changes for this document';
          break;
        default:
          hasPermission = false;
          errorMessage = 'Invalid action';
      }

      if (hasPermission) {
        next();
      } else {
        res.status(403).json({ error: errorMessage });
      }
    } catch (error) {
      console.error('Document permission check error:', error);
      res.status(500).json({ error: 'Failed to check document permissions' });
    }
  };
};

/**
 * Export permission check functions for use in tests
 */
export const documentPermissions = {
  canViewDocument,
  canEditDocument,
  canApproveDocument,
  canRejectDocument,
  canRequestChangesDocument,
  canDeleteDocument,
};
