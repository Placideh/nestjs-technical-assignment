import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import "dotenv/config";
import { EmployeeService } from "../employee/service/employee.service";




export interface JwtPayload {
    sub: string; // Employee ID
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly employeeService: EmployeeService) {
    super(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || "",
          }
    );
  }

  async validate(payload: JwtPayload) {
    const user = await this.employeeService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
