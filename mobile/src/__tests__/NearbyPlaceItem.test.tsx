import { calculateDistance } from "../utils/location";

test("distance calculation between two points", () => {
  const d = calculateDistance(45.5017, -73.5673, 45.5088, -73.5617);

  expect(d).toBeGreaterThan(0);
});
