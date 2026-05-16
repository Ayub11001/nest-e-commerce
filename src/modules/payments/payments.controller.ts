import { 
    Body,
    Controller,  
    Get,  
    Param,  
    Post,  
    UseGuards,
 } from '@nestjs/common';
import { 
    ApiBadRequestResponse,
    ApiBearerAuth, 
    ApiCreatedResponse, 
    ApiNotFoundResponse, 
    ApiOkResponse, 
    ApiOperation, 
    ApiParam, 
    ApiResponse, 
    ApiTags,

 } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { 
    CreatePaymentIntentApiResponseDto, 
    PaymentApiResponseDto, 
    PaymentResponseDto 
} from './dto/payment-response.dto';
import { CreatePaymentIntentDto } from './dto/created-payment.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ConfirmPaymetDto } from './dto/cofirm-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiTags("Payments")
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
    constructor(
        private readonly paymentService: PaymentsService
    ) {}


    @Post("create-intent")
    @ApiOperation({
        summary: "create payment intent",
        description: "Create a payment intent for an order"
    })
    @ApiCreatedResponse({
        description: "Payment intent created successfully", 
        type: CreatePaymentIntentApiResponseDto
    })
    @ApiBadRequestResponse({
        description: "invalid data or order not found"
    })
    async createPaymentIntent(
        @Body() createPaymentIntentDto: CreatePaymentIntentDto,
        @GetUser('id') userID: string
    ) {
        return await this.paymentService.createPaymentIntent(
            userID, 
            createPaymentIntentDto
        );
    }

    @Post('confirm')
    @ApiOperation({
        summary: "Confirm payment",
        description: "Confirm a payment intent for an order"
    })
    @ApiResponse({
        status: 200,
        description: "Payment confirmed successfully",
        type: PaymentResponseDto
    })
    @ApiBadRequestResponse({
        description: "Payment not found or already completed"
    })
    async confirmPayment(
        @Body() confirmPaymentDto: ConfirmPaymetDto,
        @GetUser('id') userId: string,
    ) {
        return await this.paymentService.confirmPayment(
            userId, 
            confirmPaymentDto
        )
    }

    @Get()
    @ApiOperation({
        summary: "Get all payments",
        description: "Get all payments of the current user"
    })
    @ApiOkResponse({
        description: "Payments retrieved successfully",
        type: PaymentApiResponseDto
    })
    async getAll(@GetUser('id') userId: string) {
        return await this.paymentService.getAll(userId)
    }


    @Get(':id')
    @ApiParam({
        name: 'id',
        description: "Payment-ID",
        example: "83t9potr4yhruwq3i8-9d3yqt7gwft6"
    })
    @ApiOperation({
        summary: "Get payment by ID",
        description: "Get a specific payment by current user using the payment Id"
    })
    @ApiOkResponse({
        description: "Payment retrieved successfully",
        type: PaymentApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Payment not found"
    })
    async getOne(
        @Param('id') id: string,
        @GetUser('id') userId: string
    ) {
        return await this.paymentService.getOne(id, userId)
    }

    @Get('order/:orderId')
    @ApiParam({
        name: 'orderId',
        description: "Order-ID",
        example: "83t9potr4yhruwq3i8-9d3yqt7gwft6"
    })
    @ApiOperation({
        summary: "Get payment by Order-ID",
        description: "Get a specific payment by current user using the Order-ID"
    })
    @ApiOkResponse({
        description: "Payment retrieved successfully",
        type: PaymentApiResponseDto
    })
    @ApiNotFoundResponse({
        description: "Payment not found"
    })
    async getOneByOrder(
        @Param('orderId') orderId: string,
        @GetUser('id') userId: string
    ) {
        return await this.paymentService.getOneByOrder(orderId, userId)
    }
}