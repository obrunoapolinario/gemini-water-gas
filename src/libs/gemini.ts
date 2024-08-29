import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import env from "../config/env";
import logger from "./pino";

const API_KEY = env.GEMINI_API_KEY;

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize the File Manager
const fileManager = new GoogleAIFileManager(API_KEY);

// Get the Gemini Pro model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export const uploadImage = async (
	filePath: string,
	mimeType: string,
	displayName: string,
) => {
	try {
		const uploadResponse = await fileManager.uploadFile(filePath, {
			mimeType,
			displayName,
		});
		logger.debug(
			`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`,
		);
		return uploadResponse.file;
	} catch (error) {
		logger.error("Error uploading file:", error);
		throw error;
	}
};

export const getFileMetadata = async (fileName: string) => {
	try {
		const getResponse = await fileManager.getFile(fileName);
		logger.debug(
			`Retrieved file ${getResponse.displayName} as ${getResponse.uri}`,
		);
		return getResponse;
	} catch (error) {
		logger.error("Error getting file metadata:", error);
		throw error;
	}
};

export const generateContentWithImage = async (
	fileUri: string,
	mimeType: string,
	prompt: string,
) => {
	try {
		const result = await model.generateContent([
			{
				fileData: {
					mimeType,
					fileUri,
				},
			},
			{ text: prompt },
		]);
		return result.response.text();
	} catch (error) {
		logger.error("Error generating content:", error);
		throw error;
	}
};
