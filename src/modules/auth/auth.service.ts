import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/authResponse.dto';
import bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    private SALT_ROUNDS = 12;
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const {
            email,
            firstName,
            lastName, 
            password
        } = registerDto;

        const existingUser = await this.prisma.user.findUnique(
            {
                where: {email}
            }
        )
        if(existingUser) {
            throw new ConflictException('User with this email already exists')
        }

        try {
            const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                },

                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    password: false
                }
            })

            const tokens = await this.generateTokens(user.id, user.email);
            await this.updateRefreshToken(user.id, tokens.refreshToken);

            return {
                ...tokens,
                user,
            }
        } catch (error) {
            console.error('Error during registration\n Error: ', error);
            throw new InternalServerErrorException('Registration failed')
        }
    }

    async generateTokens(
        userId: string, 
        email: string
    ): Promise<{
        accessToken: string, 
        refreshToken: string
    }> {
        const payload = {
            sub: userId,
            email
        };

        const refreshId = randomBytes(16).toString('hex');
        const [accessToken, refreshToken] = await Promise.all(
            [
                this.jwtService.signAsync(payload, {expiresIn: '15m'}),
                this.jwtService.signAsync({...payload, refreshId}, {expiresIn: '7d'})
            ]
        )

        return { accessToken, refreshToken }
    }

    async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
        await this.prisma.user.update({
            where: {id: userId},
            data: {refreshToken}
        })
    }

    async refreshTokens(userId: string): Promise<AuthResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                password: false,
                role: true
            }
        });
        if(!user) {
            throw new UnauthorizedException('User not found');
        }

        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user
        }
    }

    async logout(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                refreshToken: null
            }
        })
    }
}
