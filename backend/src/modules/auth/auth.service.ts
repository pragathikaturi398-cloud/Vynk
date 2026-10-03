import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { Role } from '../../types';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    phone?: string;
    roomId?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { status: 400, message: 'A user with this email address already exists.' };
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role: data.role || Role.STUDENT,
        phone: data.phone,
      },
    });

    if (data.roomId && (data.role === Role.STUDENT || !data.role)) {
      await prisma.roomAllocation.create({
        data: {
          room_id: data.roomId,
          student_id: user.id,
        },
      });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        hostelsWarded: { select: { id: true, name: true } },
        roomAllocations: {
          include: {
            room: {
              include: {
                floor: {
                  include: {
                    block: {
                      include: { hostel: true },
                    },
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    let roomInfo = null;
    if (user.roomAllocations.length > 0) {
      const alloc = user.roomAllocations[0];
      roomInfo = {
        roomId: alloc.room.id,
        roomNo: alloc.room.room_no,
        floor: alloc.room.floor.number,
        block: alloc.room.floor.block.name,
        hostelId: alloc.room.floor.block.hostel.id,
        hostelName: alloc.room.floor.block.hostel.name,
      };
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        hostelWarded: user.hostelsWarded[0] || null,
        room: roomInfo,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        throw { status: 401, message: 'User not found.' };
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw { status: 401, message: 'Invalid or expired refresh token.' };
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        created_at: true,
        hostelsWarded: { select: { id: true, name: true, type: true } },
        roomAllocations: {
          select: {
            room: {
              select: {
                id: true,
                room_no: true,
                floor: {
                  select: {
                    number: true,
                    block: {
                      select: {
                        id: true,
                        name: true,
                        hostel: {
                          select: { id: true, name: true, type: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          take: 1,
        },
        teamMemberships: {
          select: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    let roomInfo = null;
    if (user.roomAllocations.length > 0) {
      const r = user.roomAllocations[0].room;
      roomInfo = {
        roomId: r.id,
        roomNo: r.room_no,
        floor: r.floor.number,
        blockId: r.floor.block.id,
        blockName: r.floor.block.name,
        hostelId: r.floor.block.hostel.id,
        hostelName: r.floor.block.hostel.name,
      };
    }

    return {
      ...user,
      roomAllocations: undefined,
      room: roomInfo,
    };
  }
}
