import { describe, test, expect } from "vitest";
import { MeasureService } from "../service";

describe("Measure Service", () => {
	test("should upload a measure", () => {
		const service = new MeasureService();
		const measures = service.getMeasures();
		expect(measures).toHaveLength(2);
	});
});
