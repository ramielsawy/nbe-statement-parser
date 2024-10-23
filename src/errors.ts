// errors.ts

export class InvalidPDFFormatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidPDFFormatError';
    }
}
