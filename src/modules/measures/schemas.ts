import { z } from 'zod';
import { Base64 } from 'js-base64';

const measureTypeValues = ["WATER", "GAS"] as const;
export type MeasureType = (typeof measureTypeValues)[number];
export const measureTypeEnumSchema = z.enum(measureTypeValues).transform((val) => val.toUpperCase() as MeasureType);

const allowedImageTypes = ['png', 'jpeg', 'webp', 'heic', 'heif'] as const;
type AllowedImageType = (typeof allowedImageTypes)[number];

export const uploadSchema = z.object({
    image: z.string().refine(Base64.isValid, {
        message: "Invalid base64 string",
    }),
    customer_code: z.string().min(1, "Customer code is required").uuid("Invalid customer code"),
    measure_datetime: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    measure_type: measureTypeEnumSchema,
});

export type UploadData = z.infer<typeof uploadSchema>;

export const insertMeasureSchema = uploadSchema
    .extend({
        measure_value: z.number().min(0, "Measure value must be greater than 0"),
        image_url: z.string().min(1, "Image URL is required").url("Invalid URL"),
    })
    .omit({ image: true });

export type InsertMeasureData = z.infer<typeof insertMeasureSchema>;

export const confirmSchema = z.object({
    measure_uuid: z.string().uuid("Invalid measure UUID"),
    confirmed_value: z.number().min(0, "Confirmed value must be greater than 0"),
});

export type ConfirmData = z.infer<typeof confirmSchema>;