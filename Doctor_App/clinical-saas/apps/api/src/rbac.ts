/**
 * RBAC (Role-Based Access Control) middleware and policy engine
 * Enforces tenant isolation and role-based permissions
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@domain/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    tenant_id: string;
    roles: UserRole[];
    session_id: string;
    mfa_verified: boolean;
    ip_address: string;
    login_time: string;
  };
}

/**
 * Permission matrix: role -> actions on resources
 */
const PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  patient: {
    'Patient': ['read:self'],
    'Consent': ['create', 'read:self', 'revoke:self'],
    'Encounter': ['create:self', 'read:self'],
    'IntakeResponse': ['create:self', 'read:self'],
    'CarePlan': ['read:self'],
    'AuditEvent': ['read:self'],
  },
  clinician: {
    'Patient': ['read', 'update'],
    'Encounter': ['create', 'read', 'update'],
    'IntakeResponse': ['read'],
    'TriageAssessment': ['read'],
    'ClinicalDraft': ['create', 'read'],
    'CarePlan': ['create', 'sign', 'read'],
    'SafetyAlert': ['read', 'override'],
    'AuditEvent': ['read'],
  },
  admin: {
    '*': ['*'], // Full access within tenant
  },
  safety_officer: {
    'TriageAssessment': ['read'],
    'SafetyAlert': ['read', 'create'],
    'AuditEvent': ['read', 'export'],
    'TriageRuleSet': ['read', 'approve'],
  },
  content_reviewer: {
    'MedicineMonograph': ['create', 'read', 'update', 'approve'],
    'SourceDocument': ['read'],
    'AuditEvent': ['read'],
  },
};

/**
 * Check if user has permission for a resource action
 */
export function hasPermission(
  userRoles: UserRole[],
  resource: string,
  action: string
): boolean {
  for (const role of userRoles) {
    const rolePerms = PERMISSIONS[role];
    if (!rolePerms) continue;

    // Check wildcard admin
    if (rolePerms['*'] && rolePerms['*'].includes('*')) {
      return true;
    }

    const resourcePerms = rolePerms[resource];
    if (resourcePerms && (resourcePerms.includes('*') || resourcePerms.includes(action))) {
      return true;
    }
  }

  return false;
}

/**
 * Authentication middleware
 * In production, validates JWT token and checks session
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    // TODO: Validate JWT with KMS-protected secret
    // For MVP, we'll use a simple mock
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    req.user = {
      user_id: payload.sub,
      tenant_id: payload.tenant_id,
      roles: payload.roles,
      session_id: payload.session_id,
      mfa_verified: payload.mfa_verified === true,
      ip_address: req.ip || '',
      login_time: payload.iat,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Tenant isolation middleware
 * Ensures user can only access their own tenant
 */
export function enforceTenantIsolation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tenantFromRequest = req.params.tenant_id || req.body?.tenant_id;
  if (tenantFromRequest && tenantFromRequest !== req.user.tenant_id) {
    return res
      .status(403)
      .json({ error: 'Tenant isolation violation: cannot access other tenant data' });
  }

  next();
}

/**
 * RBAC middleware factory
 * Usage: router.get('/resource', rbac('Resource', 'read'), handler)
 */
export function rbac(resource: string, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasPermission(req.user.roles, resource, action)) {
      return res.status(403).json({
        error: `Forbidden: insufficient permissions for ${action} on ${resource}`,
      });
    }

    next();
  };
}

/**
 * MFA required middleware
 * For sensitive operations (plan signing, credential changes)
 */
export function requireMFA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.mfa_verified) {
    return res.status(403).json({ error: 'MFA required for this operation' });
  }
  next();
}

/**
 * Audit logging middleware
 * Records all mutations and sensitive reads
 */
export function auditLog(action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      if (req.user && ['create', 'update', 'delete', 'sign'].includes(action)) {
        console.log(
          JSON.stringify({
            audit_type: 'api_mutation',
            action,
            actor_id: req.user.user_id,
            tenant_id: req.user.tenant_id,
            resource: req.path,
            status: res.statusCode,
            timestamp: new Date().toISOString(),
          })
        );
      }

      return originalSend.call(this, data);
    };

    next();
  };
}
