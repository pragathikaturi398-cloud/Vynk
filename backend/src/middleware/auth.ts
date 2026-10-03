import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { hostelId?: string };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Fetch user with hostel context if warden or student
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        hostelsWarded: { select: { id: true } },
        roomAllocations: {
          select: {
            room: {
              select: {
                floor: {
                  select: {
                    block: {
                      select: { hostel_id: true }
                    }
                  }
                }
              }
            }
          },
          take: 1
        }
      }
    });

    if (!dbUser) {
      res.status(401).json({ success: false, message: 'User no longer exists.' });
      return;
    }

    let userHostelId: string | undefined = undefined;
    if (dbUser.hostelsWarded.length > 0) {
      userHostelId = dbUser.hostelsWarded[0].id;
    } else if (dbUser.roomAllocations.length > 0) {
      userHostelId = dbUser.roomAllocations[0].room.floor.block.hostel_id;
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      hostelId: userHostelId,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}
