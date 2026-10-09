import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterImagesByName,
  findExactImageByName,
  formatSearchCount,
  normalizeSearchQuery,
  pickRandomSearchIndex,
  pickRandomSearchName,
} from "../src/components/ImageGrid/search.ts";

type Img = { id: string; title: string; fileName?: string; filePath?: string };

const make = (): Img[] => [
  { id: "1", title: "Sunset Beach", fileName: "Sunset-Beach.JPG", filePath: "/AP/Sunset-Beach.JPG" },
  { id: "2", title: "mountain view", fileName: "mountain-view.png" },
  { id: "3", title: "City Lights", fileName: "city-lights.webp" },
];

describe("normalizeSearchQuery", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeSearchQuery("  SunSet "), "sunset");
  });
});

describe("filterImagesByName", () => {
  it("returns all members on empty query without mutating input", () => {
    const input = make();
    const snapshot = input.map((x) => ({ ...x }));
    const out = filterImagesByName(input, "   ");
    assert.equal(out.length, 3);
    assert.notEqual(out, input);
    assert.deepEqual(input, snapshot);
  });

  it("matches case-insensitively", () => {
    const out = filterImagesByName(make(), "SUNSET");
    assert.deepEqual(out.map((x) => x.id), ["1"]);
  });

  it("matches with or without extension", () => {
    assert.deepEqual(filterImagesByName(make(), "mountain view").map((x) => x.id), ["2"]);
    assert.deepEqual(filterImagesByName(make(), "mountain-view.png").map((x) => x.id), ["2"]);
  });

  it("matches partial substrings", () => {
    assert.deepEqual(filterImagesByName(make(), "city").map((x) => x.id), ["3"]);
    assert.deepEqual(filterImagesByName(make(), "view").map((x) => x.id), ["2"]);
  });

  it("returns empty on no match and preserves identity (no loss/dupes)", () => {
    const input = make();
    const out = filterImagesByName(input, "zzz-no-match");
    assert.deepEqual(out, []);
    const all = filterImagesByName(input, "");
    assert.equal(new Set(all.map((x) => x.id)).size, all.length);
  });

  it("matches across extensions (query extension ignored)", () => {
    const input: Img[] = [{ id: "1", title: "shot", fileName: "mountain-view.png" }];
    assert.deepEqual(
      filterImagesByName(input, "mountain-view.jpg").map((x) => x.id),
      ["1"],
    );
  });
});

describe("formatSearchCount", () => {
  it("phrases singular/plural and notes partial loads", () => {
    assert.equal(formatSearchCount(1, "sun", 30, false), '1 result for "sun"');
    assert.equal(
      formatSearchCount(3, "sun", 30, true),
      '3 results for "sun" (searched 30 loaded images)',
    );
  });
});
describe("findExactImageByName", () => {
  it("finds exact fileName or title match case-insensitively", () => {
    const input = make();
    assert.equal(findExactImageByName(input, "sunset-beach.jpg")?.id, "1");
    assert.equal(findExactImageByName(input, "CITY LIGHTS")?.id, "3");
    assert.equal(findExactImageByName(input, "partial"), undefined);
  });
});

describe("pickRandomSearchIndex", () => {
  it("returns null for zero or one item", () => {
    assert.equal(pickRandomSearchIndex(0, null), null);
    assert.equal(pickRandomSearchIndex(1, null), null);
  });

  it("never repeats the immediately previous index", () => {
    for (let i = 0; i < 50; i++) {
      const next = pickRandomSearchIndex(5, 2);
      assert.ok(next !== null && next >= 0 && next < 5 && next !== 2);
    }
  });

  it("covers more than one index over many runs", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 50; i++) seen.add(pickRandomSearchIndex(5, null)!);
    assert.ok(seen.size > 1);
  });
});

describe("pickRandomSearchName", () => {
  it("returns a member name and never repeats back-to-back", () => {
    const input = make();
    const first = pickRandomSearchName(input, null);
    assert.ok(first && input.some((x) => x.id === input[first.index].id));
    const second = pickRandomSearchName(input, first!.index);
    assert.ok(second && second.index !== first!.index);
  });

  it("fills the only name for single-item lists, null for empty", () => {
    assert.equal(pickRandomSearchName([], null), null);
    assert.deepEqual(pickRandomSearchName([{ id: "x", title: "Only" }], null), {
      index: 0,
      name: "Only",
    });
  });
});
