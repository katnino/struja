import { calculateBill, splitBlocks, DEFAULT_RATES } from "./tariff";

describe("tariff calculations", () => {
  describe("splitBlocks", () => {
    it("should correctly split consumption into blocks", () => {
      // Case 1: Only Block I
      expect(splitBlocks(300)).toEqual({ i: 300, ii: 0, iii: 0 });

      // Case 2: Block I and II
      expect(splitBlocks(800)).toEqual({ i: 500, ii: 300, iii: 0 });

      // Case 3: Block I, II, and III
      expect(splitBlocks(2000)).toEqual({ i: 500, ii: 1000, iii: 500 });

      // Case 4: Zero consumption
      expect(splitBlocks(0)).toEqual({ i: 0, ii: 0, iii: 0 });
    });
  });

  describe("calculateBill", () => {
    it("should calculate a basic bill correctly", () => {
      const vt = 100;
      const mt = 100;
      const result = calculateBill(vt, mt);

      expect(result.consumptionKwh).toBe(200);
      expect(result.blocks).toHaveLength(1); // Only Block I
      expect(result.blocks[0].kwh).toBe(200);
    });

    it("should handle zero consumption", () => {
      const result = calculateBill(0, 0);
      expect(result.consumptionKwh).toBe(0);
      expect(result.blocks).toHaveLength(0);
      expect(result.totalEnergy).toBe(0);
    });

    it("should handle invalid inputs", () => {
      // @ts-ignore
      expect(calculateBill(-100, 100).consumptionKwh).toBe(0);
      // @ts-ignore
      expect(calculateBill(NaN, 100).consumptionKwh).toBe(0);
    });

    it("should calculate costs based on VT/MT ratio", () => {
      // 100% VT consumption
      const resultVT = calculateBill(200, 0);
      const costVT = resultVT.totalEnergy;

      // 100% MT consumption
      const resultMT = calculateBill(0, 200);
      const costMT = resultMT.totalEnergy;

      // VT is generally more expensive than MT
      expect(costVT).toBeGreaterThan(costMT);
    });

    it("should correctly apply VAT", () => {
      const result = calculateBill(100, 100);
      const expectedVat = result.subtotal * DEFAULT_RATES.vat;
      expect(result.vatAmount).toBeCloseTo(expectedVat, 5);
      expect(result.total).toBeCloseTo(result.subtotal + result.vatAmount, 5);
    });
  });
});
