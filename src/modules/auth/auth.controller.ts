import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/authResponse.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private readonly authSevice: AuthService) {}

    // Register api end-point
    @ApiOperation({
        summary: 'Register a new User',
        description: 'Create a new user account'
    })

    @ApiResponse({
        status: 201,
        description: 'User successfully created',
        type: AuthResponseDto
    })
    
    @ApiResponse({
        status: 400,
        description: 'Bad request. Verification failed or user already exists',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 429,
        description: 'Too many requests. Rate limit exceeded',
        type: AuthResponseDto
    })

    @Post('register')
    @HttpCode(201)
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authSevice.register(registerDto);
    }

    // Refresh access-token api end-point

    @ApiOperation({
        summary: 'Refresh access token',
        description: 'Generates a new access token using a valid refresh token'
    })

    @ApiResponse({
        status: 201,
        description: 'New access token generated successfully',
        type: AuthResponseDto
    })
    
    @ApiResponse({
        status: 400,
        description: 'Unauthorized. Invalid or expired refresh token',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 429,
        description: 'Too many requests. Rate limit exceeded',
        type: AuthResponseDto
    })

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    @ApiBearerAuth('JWT-refresh')
    async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto> {
        return await this.authSevice.refreshTokens(userId);
    }
    
    // Logout api end-point

    @ApiOperation({
        summary: 'Logout a User',
        description: 'Logs out a user and invalidates the refresh token'
    })

    @ApiResponse({
        status: 201,
        description: 'User successfully logged out',
        type: AuthResponseDto
    })
    
    @ApiResponse({
        status: 400,
        description: 'Unauthorized. Invalid or expired refresh token',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 429,
        description: 'Too many requests. Rate limit exceeded',
        type: AuthResponseDto
    })

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard) 
    @ApiBearerAuth('JWT-auth')
    async logout(@GetUser('id') userId: string): Promise<{message: string}> {
        console.log(`userid: ${userId}`)
        await this.authSevice.logout(userId);
        return {message: 'user logged out successfully'}
    }
    
    // Login api end-point

    @ApiOperation({
        summary: 'Login a User',
        description: 'Authenticates a user and returns back access and refresh tokens'
    })

    @ApiResponse({
        status: 201,
        description: 'User successfully logged in',
        type: AuthResponseDto
    })
    
    @ApiResponse({
        status: 400,
        description: 'Unauthorized. Invalid credentails',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: AuthResponseDto
    })

    @ApiResponse({
        status: 429,
        description: 'Too many requests. Rate limit exceeded',
        type: AuthResponseDto
    })

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return await this.authSevice.login(loginDto);
    }
    
}
