import { z } from 'zod';
import { Base64 } from 'js-base64';

const measureTypeValues = ["WATER", "GAS"] as const;
export type MeasureType = (typeof measureTypeValues)[number];
const measureTypeEnumSchema = z.enum(measureTypeValues).transform((val) => val.toUpperCase() as MeasureType);

const allowedImageTypes = ['png', 'jpeg', 'webp', 'heic', 'heif'] as const;
type AllowedImageType = (typeof allowedImageTypes)[number];

export const uploadSchema = z.object({
    image: z.string().refine(Base64.isValid, {
        message: "Invalid base64 string",
    }),
    customer_code: z.string().min(1, "Customer code is required"),
    measure_datetime: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    measure_type: measureTypeEnumSchema,
});

export type UploadData = z.infer<typeof uploadSchema>;