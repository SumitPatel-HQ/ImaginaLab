import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shuffleOrder } from "../src/components/ImageGrid/shuffle.ts";

const ids = (arr: { id: string }[]) => arr.map((x) => x.id);

describe("shuffleOrder", () => {
  it("returns a new array and leaves the input untouched", () => {
    const input = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const snapshot = input.map((x) => ({ ...x }));
    const out = shuffleOrder(input);
    assert.notEqual(out, input);
    assert.deepEqual(input, snapshot);
  });

  it("preserves identity: same members, no loss, no duplicates", () => {
    const input = Array.from({ length: 20 }, (_, i) => ({ id: "img-" + i }));
    const out = shuffleOrder(input);
    assert.equal(out.length, input.length);
    assert.deepEqual([...ids(out)].sort(), [...ids(input)].sort());
    assert.equal(new Set(ids(out)).size, out.length);
  });

  it("varies order across repeated runs for lists longer than one", () => {
    const input = Array.from({ length: 10 }, (_, i) => ({ id: "img-" + i }));
    const baseline = ids(input).join(",");
    let varied = false;
    for (let i = 0; i < 20; i++) {
      if (ids(shuffleOrder(input)).join(",") !== baseline) { varied = true; break; }
    }
    assert.equal(varied, true);
  });

  it("handles empty and single-element lists", () => {
    assert.deepEqual(shuffleOrder([]), []);
    const one = [{ id: "only" }];
    const out = shuffleOrder(one);
    assert.deepEqual(out, one);
    assert.notEqual(out, one);
  });
});
