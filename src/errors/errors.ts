class AppError extends Error {
    public readonly error_code: string;
    constructor(message: string, error_code: string) {
        super(message);
        this.error_code = error_code;
    }
}

class InvalidDataError extends AppError {
    constructor(message: string) {
        super(message, "INVALID_DATA");
    }
}

class DoubleReportError extends AppError {
    constructor(message: string) {
        super(message, "DOUBLE_REPORT");
    }
}

class InternalServerError extends AppError {
    constructor(message: string) {
        super(message, "INTERNAL_SERVER_ERROR");
    }
}