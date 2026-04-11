import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super()
    }

    canActivate(context: ExecutionContext) {
        console.log('hitting the guard')
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        console.log('err:', err)
        console.log('user:', user)
        console.log('info:', info)
        return super.handleRequest(err, user, info, context)
    }
}