import { 
    Body, 
    Controller, 
    Delete, 
    Get, 
    Param, 
    Patch, 
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
    ApiOkResponse, 
    ApiOperation, 
    ApiParam, 
    ApiQuery, 
    ApiResponse, 
    ApiTags, 
    ApiTooManyRequestsResponse, 
    getSchemaPath
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { 
    OrderApiResponseDto, 
    OrderResponseDto, 
    PaginatedOrderResponseDto,
} from './dto/order-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { 
    ModerateThrottle, 
    RelaxedThrottle
} from 'src/common/decorators/custom-throttler.decorator';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { QueryOrderDto } from './dto/queryOrder.dto';
import { UpdateOrderDto } from './dto/update-order.dto';


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
        name: "search",
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

    @Get()
    @RelaxedThrottle()
    @ApiOperation({
        summary: "Get all user paginated orders"
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
    @ApiQuery({
        name: "status",
        required: false,
        type: String
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String
    })
    @ApiOkResponse({
        description: "List of all the orders of a user",
        type: PaginatedOrderResponseDto
    })
    async getAllUserOrders(
        @Query() query: QueryOrderDto,
        @GetUser('id') userId: string
    ): Promise<{
        data: OrderResponseDto[];
        page: number;
        limit: number;
        total: number;
    }> {
        return await this.orderService.getAllByUserId(query, userId)
    }

    @Get(':id')
    @Roles(Role.ADMIN)
    @RelaxedThrottle()
    @ApiOperation({
        summary: "Get order by id (for admins)"
    })
    @ApiOkResponse({
        description: "Order details",
        type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    @ApiForbiddenResponse({
        description: "Admin access reqruired"
    })
    async getByIdAdmin(@Param('id') id: string) {
        return await this.orderService.getById(id)
    }


    @Get(':id')
    @RelaxedThrottle()
    @ApiOperation({
        description: "Get an order by its id for current user"
    })
    @ApiParam({
        name: "id",
        description: "Order ID"
    })
    @ApiOkResponse({
        description: "Order details",
        type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    async getById(@Param('id') id: string, @GetUser('id') userId: string)
    : Promise<OrderApiResponseDto<OrderResponseDto>> {
        return await this.orderService.getById(id, userId)
    }

    @Patch('admin/:id')
    @Roles(Role.ADMIN)
    @ModerateThrottle()
    @ApiOperation({
        summary: "Update any order bu id for admin"
    })
    @ApiParam({
        name: "id", // order-id
        description: "Order-ID"
    })
    @ApiBody({
        type: UpdateOrderDto
    })
    @ApiOkResponse({
        description: "Order updated successfully",
        type: OrderResponseDto
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    @ApiForbiddenResponse({
        description: "Admin access required"
    })
    async updateAdmin(
        @Param('id') id: string, 
        @Body() updateDto: UpdateOrderDto
    ): Promise<OrderApiResponseDto<OrderResponseDto>> {
        return await this.orderService.update(id, updateDto)
    }


    @Patch(':id') // order-id
    @ModerateThrottle()
    @ApiOperation({
        description: "Update your own order",
    })
    @ApiParam({
        name: "id",
        description: "Order-ID"
    })
    @ApiBody({
        type: OrderApiResponseDto
    })
    @ApiOkResponse({
        description: "Order updaated successfully"
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateOrderDto,
        @GetUser('id') userId: string
    ): Promise<OrderApiResponseDto<OrderResponseDto>>  {
        return await this.orderService.update(id, updateDto, userId)
    }

    @Patch('admin/:id')
    @Roles(Role.ADMIN)
    @ModerateThrottle()
    @ApiOperation({
        summary: "Cancel order for admins"
    })
    @ApiParam({
        name: "id",
        description: "Order-ID"
    })
    @ApiOkResponse({
        description: "Order cancelled successfully",
        type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    async cancelAdmin(@Param('id') id: string)
    : Promise<OrderApiResponseDto<OrderResponseDto>> {
        return await this.orderService.cancel(id);
    }

    @Patch(':id')
    @ModerateThrottle()
    @ApiOperation({
        summary: "Cancel order by user"
    })
    @ApiParam({
        name: "id",
        description: "Order-ID"
    })
    @ApiOkResponse({
        description: "Order cancelled successfully",
        type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Order not found"
    })
    async cancel(
        @Param('id') id: string, 
        @GetUser('id') userId: string,
    ): Promise<OrderApiResponseDto<OrderResponseDto>> {
        return await this.orderService.cancel(id, userId)
    }
}
