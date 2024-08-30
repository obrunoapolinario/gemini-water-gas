import { ConfirmationDuplicateError, DoubleReportError, MeasureNotFoundError } from "../../errors/errors";
import prisma from "../../libs/prisma";
import type { InsertMeasureData, MeasureType } from "./schemas";

export const checkIfMeasureExists = async (customerCode: string, measureType: string, measureDatetime: Date) => {
	const startOfMonth = new Date(measureDatetime.getFullYear(), measureDatetime.getMonth(), 1);
	const endOfMonth = new Date(measureDatetime.getFullYear(), measureDatetime.getMonth() + 1, 0);

	return await prisma.measure.findFirst({
		where: {
			customer: { id: customerCode },
			measureType: measureType as MeasureType,
			measureDatetime: {
				gte: startOfMonth,
				lte: endOfMonth,
			},
		},
	});
};

export const create = async ({
	customer_code,
	measure_datetime,
	measure_type,
	measure_value,
	image_url,
}: InsertMeasureData) => {
	const existingMeasure = await checkIfMeasureExists(customer_code, measure_type, new Date(measure_datetime));

	if (existingMeasure) {
		throw new DoubleReportError("Leitura do mês já realizada");
	}

	await prisma.customer.upsert({
		where: { id: customer_code },
		update: {},
		create: { id: customer_code },
	});

	const newMeasure = await prisma.measure.create({
		data: {
			customer: { connect: { id: customer_code } },
			measureType: measure_type,
			measureDatetime: new Date(measure_datetime),
			measureValue: measure_value,
			imageUrl: image_url,
		},
	});

	return newMeasure;
};

export const listByCustomerCode = async (customerCode: string, measureType: MeasureType | undefined) => {
	const measures = await prisma.measure.findMany({
		where: {
			customer: { id: customerCode },
			...(measureType && { measureType }),
		},
		orderBy: { measureDatetime: "desc" },
	});

	if (measures.length === 0) {
		throw new MeasureNotFoundError("Nenhuma leitura encontrada");
	}

	return measures.map((measure) => ({
		measure_uuid: measure.id,
		measure_datetime: measure.measureDatetime,
		measure_type: measure.measureType,
		has_confirmed: measure.hasConfirmed,
		image_url: measure.imageUrl,
	}));
};

export const confirm = async (measureUuid: string, confirmedValue: number) => {
	const measure = await prisma.measure.findUnique({
		where: { id: measureUuid },
	});

	if (!measure) {
		throw new MeasureNotFoundError("Leitura do mês já realizada");
	}

	if (measure.hasConfirmed) {
		throw new ConfirmationDuplicateError("Leitura do mês já realizada");
	}

	const updatedMeasure = await prisma.measure.update({
		where: { id: measureUuid },
		data: { measureValue: confirmedValue, hasConfirmed: true },
	});

	return updatedMeasure;
};
