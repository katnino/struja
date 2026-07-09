import { formatReading } from "./format";

describe("format utilities", () => {
  describe("formatReading", () => {
    it("should format VT and MT values correctly", () => {
      expect(formatReading({ vt: 123, mt: 456 })).toBe("VT 123 · MT 456 kWh");
    });

    it("should handle null VT", () => {
      expect(formatReading({ vt: null, mt: 456 })).toBe("VT — · MT 456 kWh");
    });

    it("should handle null MT", () => {
      expect(formatReading({ vt: 123, mt: null })).toBe("VT 123 · MT — kWh");
    });

    it("should handle both null", () => {
      expect(formatReading({ vt: null, mt: null })).toBe("VT — · MT — kWh");
    });

    it("should handle zero values", () => {
      expect(formatReading({ vt: 0, mt: 0 })).toBe("VT 0 · MT 0 kWh");
    });

    it("should handle decimal values", () => {
      expect(formatReading({ vt: 123.456, mt: 789.012 })).toBe("VT 123 · MT 789 kWh");
    });
  });
});
