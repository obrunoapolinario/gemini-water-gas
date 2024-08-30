import type { HttpCodes } from "fastify/types/utils";

export class AppError extends Error {
	public readonly errorCode: string;
	public readonly statusCode: HttpCodes;
	constructor(message: string, error_code: string, statusCode: HttpCodes) {
		super(message);
		this.errorCode = error_code;
		this.statusCode = statusCode;
	}
}

export class InvalidDataError extends AppError {
	constructor(message: string) {
		super(message, "INVALID_DATA", 400);
	}
}

export class DoubleReportError extends AppError {
	constructor(message: string) {
		super(message, "DOUBLE_REPORT", 409);
	}
}

export class ConfirmationDuplicateError extends AppError {
	constructor(message: string) {
		super(message, "CONFIRMATION_DUPLICATE", 409);
	}
}

export class MeasureNotFoundError extends AppError {
	constructor(message: string) {
		super(message, "MEASURE_NOT_FOUND", 404);
	}
}

export class MeasuresNotFoundError extends AppError {
	constructor(message: string) {
		super(message, "MEASURES_NOT_FOUND", 404);
	}
}

export class InvalidTypeError extends AppError {
	constructor(message: string) {
		super(message, "INVALID_TYPE", 400);
	}
}

export class InternalServerError extends AppError {
	constructor(message: string) {
		super(message, "INTERNAL_SERVER_ERROR", 500);
	}
}
