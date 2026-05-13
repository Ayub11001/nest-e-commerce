import { 
    Body, 
    Controller, 
    Get, 
    Post, 
    Query, 
    UseGuards    
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { 
    ApiBadRequestResponse, 
    ApiBearerAuth, 
    ApiBody, 
    ApiCreatedResponse, 
    ApiForbiddenResponse, 
    ApiNotFoundResponse, 
    ApiOperation, 
    ApiQuery, 
    ApiResponse, 
    ApiTags, 
    ApiTooManyRequestsResponse, 
    getSchemaPath
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrderApiResponseDto, OrderResponseDto } from './dto/order-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { 
    ModerateThrottle, 
    RelaxedThrottle
} from 'src/common/decorators/custom-throttler.decorator';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { QueryOrderDto } from './dto/queryOrder.dto';

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


    @Get('admin/all')
    @Roles(Role.ADMIN)
    @RelaxedThrottle()
    @ApiOperation({
        summary: "Get all the orders with pagination ( for admins )"
    })
    @ApiQuery({
        name: "status",
        required: false,
        type: String
    })
    @ApiQuery({
        name: "page",
        required: false,
        type: Number
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number
    })
    @ApiResponse({
        description: "List of paginated orders",
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "array",
                    items: { $ref: getSchemaPath(OrderResponseDto) }
                },
                page: {type: "number"},
                limit: {type: "number"},
                total: {type: "number"},
            }
        }
    })
    @ApiForbiddenResponse({
        description: "Admin access required"
    })
    async getAllOrders(@Query() query: QueryOrderDto): Promise<{
        data: OrderResponseDto[];
        page: number;
        limit: number;
        total: number;
    }> {
        return await this.orderService.getAll(query);
    }
}
