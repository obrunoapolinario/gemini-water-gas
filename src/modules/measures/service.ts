import { generateContentWithImage, uploadImage } from "../../libs/gemini";
import { insertMeasureSchema, type UploadData } from "./schemas";
import fs from "node:fs";
import path from "node:path";
import { create } from "./repository";
import prisma from "../../libs/prisma";
import { ConfirmationDuplicateError, InternalServerError, MeasureNotFoundError } from "../../errors/errors";

export const createMeasure = async ({ image, customer_code, measure_datetime, measure_type }: UploadData) => {
	const imagePath = await saveBase64Image(image);

	const uploadedFile = await uploadImage(imagePath, "image/png", "measure_image.png");

	const prompt = `Analize esta imagem e extraia o valor da leitura de ${measure_type.toLocaleLowerCase()}. Retorne apenas o valor numérico.`;
	const result = await generateContentWithImage(uploadedFile.uri, "image/png", prompt);

	const measureValue = Number.parseInt(result, 10);
	if (Number.isNaN(measureValue)) {
		throw new InternalServerError("Erro ao extrair valor da imagem");
	}

	const insertValues = insertMeasureSchema.parse({
		customer_code,
		measure_datetime,
		measure_type,
		measure_value: measureValue,
		image_url: uploadedFile.uri,
	});

	const newMeasure = await create(insertValues);

	fs.unlinkSync(imagePath);

	return {
		image_url: uploadedFile.uri,
		measure_value: measureValue,
		measure_uuid: newMeasure.id,
	};
};

export const saveBase64Image = (base64String: string) => {
	const buffer = Buffer.from(base64String, "base64");
	const tempDir = path.join(__dirname, "../../temp");
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true });
	}
	const filePath = path.join(tempDir, `temp_${Date.now()}.png`);
	fs.writeFileSync(filePath, buffer);
	return filePath;
};

export const confirmMeasure = async (measureUuid: string, confirmedValue: number) => {
	const measure = await prisma.measure.findUnique({
		where: { id: measureUuid },
	});

	if (!measure) {
		throw new MeasureNotFoundError("Leitura do mês já realizada");
	}

	if (measure.hasConfirmed) {
		throw new ConfirmationDuplicateError("Leitura do mês já realizada");
	}

	await prisma.measure.update({
		where: { id: measureUuid },
		data: { measureValue: confirmedValue, hasConfirmed: true },
	});

	return { success: true };
};

const listMeasures = async (customerCode: string, measureType?: "WATER" | "GAS") => {
	const measures = await prisma.measure.findMany({
		where: {
			customerId: customerCode,
			...(measureType && { measureType }),
		},
		orderBy: { measureDatetime: "desc" },
	});

	return measures.map((measure) => ({
		measure_datetime: measure.measureDatetime,
		measure_type: measure.measureType,
		measure_value: measure.measureValue,
		image_url: measure.imageUrl,
		has_confirmed: measure.hasConfirmed,
	}));
};
