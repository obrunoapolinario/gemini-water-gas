import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import env from "../config/env";
import logger from "./pino";

export const uploadImage = async (filePath: string, mimeType: string, displayName: string) => {
	const API_KEY = env.GEMINI_API_KEY;
	const fileManager = new GoogleAIFileManager(API_KEY);

	const uploadResponse = await fileManager.uploadFile(filePath, {
		mimeType,
		displayName,
	});
	logger.debug(`File uploaded, uri: ${uploadResponse.file.uri}`, "gemini.uploadImage");
	return uploadResponse.file;
};

export const getFileMetadata = async (fileName: string) => {
	const API_KEY = env.GEMINI_API_KEY;
	const fileManager = new GoogleAIFileManager(API_KEY);

	const getResponse = await fileManager.getFile(fileName);
	logger.debug(`Retrieved file ${getResponse.displayName} as ${getResponse.uri}`, "gemini.getFileMetadata");
	return getResponse;
};

export const generateContentWithImage = async (fileUri: string, mimeType: string, prompt: string) => {
	const API_KEY = env.GEMINI_API_KEY;
	const genAI = new GoogleGenerativeAI(API_KEY);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

	const result = await model.generateContent([
		{
			fileData: {
				mimeType,
				fileUri,
			},
		},
		{ text: prompt },
	]);
	logger.debug(
		`Generated ${result.response.text()} using ${prompt} and ${fileUri}`,
		"gemini.generateContentWithImage",
	);
	return result.response.text();
};
