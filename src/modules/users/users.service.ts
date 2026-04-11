import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class UsersService {
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
}
