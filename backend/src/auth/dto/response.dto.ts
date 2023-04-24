import { HttpStatus } from "@nestjs/common";

export interface ApiResponse {
  status: HttpStatus;
  message?: string;
  cookie?: string;
}