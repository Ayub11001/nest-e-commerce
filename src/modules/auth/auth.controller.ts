import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/authResponse.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authSevice: AuthService) {}

    // Register api endpoint
    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authSevice.register(registerDto);
    }

    //Refresh access-token api end point
    @UseGuards(RefreshTokenGuard)
    async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto> {
        return await this.authSevice.refreshTokens(userId);
    }
}
