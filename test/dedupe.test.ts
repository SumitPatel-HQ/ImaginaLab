import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCurrentFileEntry } from "../src/services/ImageKit/fileFilter.ts";
import { mergeUniqueImages } from "../src/components/ImageGrid/dedupe.ts";

describe("isCurrentFileEntry", () => {
  it("keeps current file entries", () => {
    assert.equal(isCurrentFileEntry({ type: "file" }), true);
  });

  it("treats a missing type as a file for backward compatibility", () => {
    assert.equal(isCurrentFileEntry({}), true);
  });

  it("drops folder records", () => {
    assert.equal(isCurrentFileEntry({ type: "folder" }), false);
  });

  it("drops historical file versions (same photo, different id)", () => {
    assert.equal(isCurrentFileEntry({ type: "file-version" }), false);
  });

  it("drops nullish entries", () => {
    assert.equal(isCurrentFileEntry(null), false);
    assert.equal(isCurrentFileEntry(undefined), false);
  });
});

describe("mergeUniqueImages", () => {
  it("drops incoming images with an already-seen id", () => {
    const existing = [{ id: "a", src: "a.jpg" }];
    const incoming = [{ id: "a", src: "a.jpg" }, { id: "b", src: "b.jpg" }];
    assert.deepEqual(mergeUniqueImages(existing, incoming), [
      { id: "a", src: "a.jpg" },
      { id: "b", src: "b.jpg" },
    ]);
  });

  it("drops distinct ids that point at the same filePath", () => {
    const existing = [{ id: "v1", src: "u1", filePath: "/AP/pic.jpg" }];
    const incoming = [{ id: "v2", src: "u2", filePath: "/AP/pic.jpg" }];
    assert.deepEqual(mergeUniqueImages(existing, incoming), existing);
  });

  it("falls back to src when filePath is absent", () => {
    const existing = [{ id: "v1", src: "same.jpg" }];
    const incoming = [{ id: "v2", src: "same.jpg" }, { id: "v3", src: "other.jpg" }];
    assert.deepEqual(mergeUniqueImages(existing, incoming), [
      { id: "v1", src: "same.jpg" },
      { id: "v3", src: "other.jpg" },
    ]);
  });

  it("keeps genuinely distinct images and skips malformed entries", () => {
    const existing = [{ id: "a", src: "a.jpg" }];
    const incoming = [{ id: "", src: "x.jpg" }, { id: "b", src: "b.jpg" }];
    assert.deepEqual(mergeUniqueImages(existing, incoming), [
      { id: "a", src: "a.jpg" },
      { id: "b", src: "b.jpg" },
    ]);
  });

  it("returns a new array and leaves inputs untouched", () => {
    const existing = [{ id: "a", src: "a.jpg" }];
    const incoming = [{ id: "b", src: "b.jpg" }];
    const out = mergeUniqueImages(existing, incoming);
    assert.notEqual(out, existing);
    assert.notEqual(out, incoming);
    assert.deepEqual(existing, [{ id: "a", src: "a.jpg" }]);
    assert.deepEqual(incoming, [{ id: "b", src: "b.jpg" }]);
  });
});
