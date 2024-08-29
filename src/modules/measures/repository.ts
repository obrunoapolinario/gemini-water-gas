import prisma from "../../libs/prisma";
import type     { MeasureType } from "./schemas";

export async function checkIfMeasureExists(customerCode: string, measureType: string, measureDatetime: Date) {
    const startOfMonth = new Date(measureDatetime.getFullYear(), measureDatetime.getMonth(), 1);
    const endOfMonth = new Date(measureDatetime.getFullYear(), measureDatetime.getMonth() + 1, 0);

    return await prisma.measure.findFirst({
        where: {
            customer: { code: customerCode },
            measureType: measureType as MeasureType,
            measureDatetime: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    });
}
