import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { Role } from '../../types';

export class AuthService {
  /**
   * Student self-registration (email + password only)
   */
  static async registerStudent(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw { status: 400, message: 'An account with this email address already exists.' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: 'Student', // Default until onboarding completion
        email: normalizedEmail,
        password_hash,
        role: Role.STUDENT,
        is_first_login: true,
      },
    });

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
        student_id_number: user.student_id_number,
        is_first_login: user.is_first_login,
        room: null,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Student first login profile completion (name, studentId, hostelName, roomNumber)
   */
  static async completeStudentOnboarding(
    userId: string,
    data: { name: string; studentId: string; hostelName: string; roomNumber: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    // 1. Locate or create Hostel
    const cleanHostelName = data.hostelName.trim();
    let hostel = await prisma.hostel.findFirst({
      where: { name: cleanHostelName },
    });
    if (!hostel) {
      hostel = await prisma.hostel.create({
        data: {
          name: cleanHostelName,
          type: 'COED',
        },
      });
    }

    // 2. Locate or create Block
    let block = await prisma.block.findFirst({
      where: { hostel_id: hostel.id },
    });
    if (!block) {
      block = await prisma.block.create({
        data: {
          hostel_id: hostel.id,
          name: 'Main Block',
        },
      });
    }

    // 3. Locate or create Floor
    let floor = await prisma.floor.findFirst({
      where: { block_id: block.id },
    });
    if (!floor) {
      floor = await prisma.floor.create({
        data: {
          block_id: block.id,
          number: 1,
        },
      });
    }

    // 4. Locate or create Room
    const cleanRoomNo = data.roomNumber.trim();
    let room = await prisma.room.findFirst({
      where: {
        floor_id: floor.id,
        room_no: cleanRoomNo,
      },
    });
    if (!room) {
      room = await prisma.room.create({
        data: {
          floor_id: floor.id,
          room_no: cleanRoomNo,
          capacity: 2,
        },
      });
    }

    // 5. Allocate room to student (remove prior allocations if any)
    await prisma.roomAllocation.deleteMany({ where: { student_id: userId } });
    await prisma.roomAllocation.create({
      data: {
        room_id: room.id,
        student_id: userId,
      },
    });

    // 6. Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name.trim(),
        student_id_number: data.studentId.trim(),
        is_first_login: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        student_id_number: true,
        is_first_login: true,
      },
    });

    const roomInfo = {
      roomId: room.id,
      roomNo: room.room_no,
      floor: floor.number,
      blockId: block.id,
      blockName: block.name,
      hostelId: hostel.id,
      hostelName: hostel.name,
    };

    return {
      user: {
        ...updatedUser,
        room: roomInfo,
      },
    };
  }

  /**
   * Super Admin first-time password setup
   */
  static async setFirstTimePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    const isMatch = await bcrypt.compare(currentPass, user.password_hash);
    if (!isMatch) {
      throw { status: 400, message: 'Current password does not match.' };
    }

    const newHash = await bcrypt.hash(newPass, 10);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newHash,
        is_first_login: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        student_id_number: true,
        is_first_login: true,
        is_active: true,
      },
    });

    return { user: updated };
  }

  /**
   * Universal Login
   */
  static async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    if (!user.is_active) {
      throw {
        status: 403,
        message: 'Your account has been deactivated. Please contact the Super Administrator.',
      };
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
        blockId: alloc.room.floor.block.id,
        blockName: alloc.room.floor.block.name,
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
        student_id_number: user.student_id_number,
        is_first_login: user.is_first_login,
        is_active: user.is_active,
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
        student_id_number: true,
        is_first_login: true,
        is_active: true,
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
