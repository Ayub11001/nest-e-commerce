import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private SALT_ROUNDS = 12
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async findOne(userId: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            select: {
                id: true, 
                email: true, 
                firstName: true,
                lastName: true,
                password: false,
                role: true,
                createdAt: true, 
                updatedAt: true
            }
        });
        if(!user) {
            throw new NotFoundException('User not found')
        }

        return user;
    }

    async findAll(): Promise<UserResponseDto[]> {
        return await this.prisma.user.findMany({
            select: {
                id: true, 
                email: true, 
                firstName: true,
                lastName: true,
                password: false,
                role: true,
                createdAt: true, 
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    async update(
        userId: string, 
        updateUserDto: UpdateUserDto
    ): Promise<UserResponseDto> {
        const existingUser = await this.prisma.user.findUnique({
            where: {id: userId},
        })
        if(!existingUser) {
            throw new NotFoundException('User not found')
        }

        if(updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: {email: updateUserDto.email}
            })
            if(emailTaken) {
                throw new NotFoundException('email already taken')
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: {id: userId},
            data: updateUserDto,
            select: {
                id: true, 
                email: true, 
                firstName: true,
                lastName: true,
                password: false,
                role: true,
                createdAt: true, 
                updatedAt: true
            }
        });
        return updatedUser;
    }

    async changePassword(
        userId: string, 
        changePasswordDto: ChangePasswordDto
    ): Promise<{message: string}> {
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });
        if(!user) {
            throw new NotFoundException('User not found')
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if(!isPasswordValid) {
            throw new ForbiddenException('Incorrect Password')
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if(isSamePassword) {
            throw new ForbiddenException('New password must be different from th ecurrent one')
        }

        const newHashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS)

        await this.prisma.user.update({
            where: {id: userId},
            data: {password: newHashedPassword}
        });

        return {
            message: 'Password changed successfully'
        }
    }

    async remove(userId: string): Promise<{message: string}>  {
        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });
        if(!user) {
            throw new NotFoundException('User not found')
        }

        await this.prisma.user.delete({
            where: {id: userId}
        });

        return {message: 'User account deleted successfully'}
    }

}
