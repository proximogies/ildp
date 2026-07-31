import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'active') {
    return res.status(401).json({ success: false, message: 'User not found or inactive' });
  }

  // Flatten permissions
  const permissions = new Set();
  const roles = [];
  for (const ur of user.userRoles) {
    roles.push(ur.role.code);
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.code);
    }
  }

  req.user = { ...user, roles, permissions: [...permissions] };
  next();
}

export function authorize(...permissionCodes) {
  return (req, res, next) => {
    const hasPermission = permissionCodes.some(code => req.user.permissions.includes(code));
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireRole(...roleCodes) {
  return (req, res, next) => {
    const hasRole = roleCodes.some(code => req.user.roles.includes(code));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Access denied for your role' });
    }
    next();
  };
}
