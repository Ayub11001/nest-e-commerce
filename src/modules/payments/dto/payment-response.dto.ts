import { ApiProperty } from "@nestjs/swagger";

export class PaymentResponseDto {
     @ApiProperty({
        example: "1f023f3dd4r56e7a8s9"
    })
    id: string

    @ApiProperty({
        example: "Order-123"
    })
    orderId: string;

    @ApiProperty({
        example: 999.99
    })
    amount: number;

    @ApiProperty({
        example: "user-456"
    })
    userId: string;

    @ApiProperty({
        example: "usd"
    })
    currency: string;

    @ApiProperty({
        example: "COMPLETED",
        enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
    })
    status: string;

    @ApiProperty({
        example: "STRIPE",
        nullable: true,
    })
    paymentMethod: string | null;

    @ApiProperty({
        example: "pi_283762845"
    })
    transactionId: string | null;

    @ApiProperty({})
    createdAt: Date;

    @ApiProperty({})
    updatedAt: Date;
}


export class CreatePaymentIntentResponse {
    @ApiProperty({
        example: "pi_35468157",
        description: "Stripe client secret for payment confirmation"
    })
    clientSecret: string;

    @ApiProperty({
        example: "2109813527",
        description: "Payment ID in database"
    })
    paymentId: string;
}


export class PaymentApiResponseDto {
    @ApiProperty({
        example: true
    })
    success: boolean;

    @ApiProperty({
        type: CreatePaymentIntentResponse
    })
    data: CreatePaymentIntentResponse;

    @ApiProperty({
        example: "Payment retrieved successfully",
        required: false,
    })
    message?: string;
}


export class CreatePaymentIntentApiResponseDto {

}