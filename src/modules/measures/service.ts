import type { PrismaClient } from '@prisma/client'
import { generateContentWithImage, uploadImage } from '../../libs/gemini'
import type { UploadData } from './schemas'
import fs from 'fs'
import path from 'path';

export class MeasureService {
  constructor(private prisma: PrismaClient) {}

  async createMeasure({ image, customer_code, measure_datetime, measure_type }: UploadData) {
    // Decode and save the base64 image
    const imagePath = await this.saveBase64Image(image);

    try {
      // Upload the image to Gemini
      const uploadedFile = await uploadImage(imagePath, 'image/png', 'measure_image.png');

      // Generate content with the image
      const prompt = `Vôce pode analizar esta imagem e extrair o valor da leitura de ${measure_type.toLocaleLowerCase()}?`;
      const result = await generateContentWithImage(uploadedFile.uri, 'image/png', prompt);

      // Process the result and create the measure
      const measureValue = result;

      // Clean up the temporary file
      fs.unlinkSync(imagePath);

      return { success: true, measure: measureValue };
    } catch (error) {
      // Clean up the temporary file in case of error
      fs.unlinkSync(imagePath);
      throw error;
    }
  }

  private async saveBase64Image(base64String: string): Promise<string> {
    const buffer = Buffer.from(base64String, 'base64');
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `temp_${Date.now()}.png`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async confirmMeasure(measureUuid: string, confirmedValue: number) {
    const measure = await this.prisma.measure.findUnique({
      where: { id: measureUuid },
    })
  
    if (!measure) {
      return { error: 'MEASURE_NOT_FOUND' }
    }
  
    if (measure.hasConfirmed) {
      return { error: 'CONFIRMATION_DUPLICATE' }
    }
  
    await this.prisma.measure.update({
      where: { id: measureUuid },
      data: { measureValue: confirmedValue, hasConfirmed: true },
    })
  
    return { success: true }
  }

  async listMeasures(customerCode: string, measureType?: 'WATER' | 'GAS') {
    const measures = await this.prisma.measure.findMany({
      where: {
        customerId: customerCode,
        ...(measureType && { measureType }),
      },
      orderBy: { measureDatetime: 'desc' },
    })

    return measures.map((measure) => ({
      measure_datetime: measure.measureDatetime,
      measure_type: measure.measureType,
      measure_value: measure.measureValue,
      image_url: measure.imageUrl,
      has_confirmed: measure.hasConfirmed,
    }))
  }
}