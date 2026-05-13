import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrderApiResponseDto } from './dto/order-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ModerateThrottle } from 'src/common/decorators/custom-throttler.decorator';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RoleGuard)
export class OrdersController {
    constructor (
        private readonly orderService: OrdersService,
    ) {}

    @Post()
    @ModerateThrottle()
    @ApiOperation({
        summary: "Create a new order"
    })
    @ApiBody({
        type: CreateOrderDto
    })
    @ApiCreatedResponse({
        description: 'Order created successfully',
        type: OrderApiResponseDto
    })
    @ApiBadRequestResponse({
        description: 'Invalid data or insufficient stock'
    })
    @ApiNotFoundResponse({
        description: 'Cart not found or empty'
    })
    @ApiTooManyRequestsResponse({
        description: 'Too many requests - rate limit exceeded'
    })
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @GetUser('id') userId: string,
    ) {
        return await this.orderService.create(userId, createOrderDto)
    }
}
