import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/created-payment.dto';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '@prisma/client';
import { ConfirmPaymetDto } from './dto/cofirm-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
    private stripe: InstanceType<typeof Stripe>;
    constructor(
        private readonly prisma: PrismaService,
    ) {
        this.stripe = new Stripe(
            process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2026-04-22.dahlia'
            }
        )
    }

    async createPaymentIntent(
        userId: string,
        paymentIntentDto: CreatePaymentIntentDto
    ): Promise<{
        success: boolean;
        data: { clientSecret: string, paymentId: string };
        message: string;
    }> {

        const {
            orderId, 
            amount,
            currency = 'usd'
        } = paymentIntentDto;

        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            },
        });
        if(!order) {
            throw new NotFoundException(`Order with order-id ${orderId} not found`)
        }
        
        const existingPayment = await this.prisma.payment.findFirst({
            where: { orderId }
        });
        if(
            existingPayment &&
            existingPayment.status === PaymentStatus.COMPLETED
        ) {
            throw new BadRequestException("Payment already completed for this order");
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            metadata: { orderId, userId }
        });

        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                userId,
                amount,
                currency,
                status: PaymentStatus.PENDING,
                paymentMethod: "STRIPE",
                transactionId: paymentIntent.id,
            }
        });

        return {
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret!,
                paymentId: payment.id
            },
            message: "Payment intent created successfully"
        }
    }

    async confirmPayment(
        userId: string,
        confirmPaymentDto: ConfirmPaymetDto,
    ): Promise<{
        success: boolean;
        data: PaymentResponseDto;
        message: string;
    }> {
        const {
            paymentIntentId,
            orderId
        } = confirmPaymentDto;

        const payment = await this.prisma.payment.findFirst({
            where: {
                transactionId: paymentIntentId,
                orderId,
                userId
            }
        });
        if(!payment) {
            throw new NotFoundException("Payment not found");
        }
        if(payment.status === PaymentStatus.COMPLETED) {
            throw new BadRequestException("Payment is already complete");
        }

        const paymentIntent = await this
            .stripe
            .paymentIntents
            .retrieve(paymentIntentId);
        if(paymentIntent.status !== 'succeeded') {
            throw new BadRequestException("Payment not successfull")
        }

        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.COMPLETED }
            }),

            this.prisma.order.update({
                where: { id: orderId },
                data: { status: "PROCESSING" }
            }),
        ]);

        const order = await this.prisma.order.findUnique({
            where: { id: orderId }
        });
        if(order?.cartId) {
            await this.prisma.cart.update({
                where: {id: order.cartId},
                data: { checkedOut: true },
            });
        }

        return {
            success: true,
            data: this.mapToPaymentResponse(updatedPayment),
            message: "Payment confirmed"
        }
    }

    async getAll(userId: string): Promise<{
        success: boolean;
        data: PaymentResponseDto[];
        message: string;
    }> {
        const payments = await this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            data: payments.map(
                payment => this.mapToPaymentResponse(payment)
            ),
            message: "All payments retrived successfully"
        }
    }

    async getOne(id: string, userId: string): Promise<{
        success: boolean;
        data: PaymentResponseDto;
        message: string;
    }> {
        const payment = await this.prisma.payment.findUnique({
            where: { id, userId }
        });
        if(!payment) {
            throw new NotFoundException(`Payment with id ${id} not found`)
        }

        return {
            success: true,
            data: this.mapToPaymentResponse(payment),
            message: "Payment retrived successfully"
        }
    }

    async getOneByOrder(orderId: string, userId: string): Promise<{
        success: boolean;
        data: PaymentResponseDto;
        message: string;
    }> {
        const payment = await this.prisma.payment.findFirst({
            where: { orderId, userId }
        });
        if(!payment) {
            throw new NotFoundException(`Payment with Order-ID ${orderId} not found`)
        }

        return {
            success: true,
            data: this.mapToPaymentResponse(payment),
            message: "Payment retrived successfully"
        }
    }

    private mapToPaymentResponse(payment: Payment): PaymentResponseDto {
        return {
            id: payment.id,
            orderId: payment.orderId,
            userId: payment.userId,
            currency: payment.currency,
            amount: Number(payment.amount),
            status: payment.status,
            transactionId: payment.transactionId,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt
        }
    }
}
