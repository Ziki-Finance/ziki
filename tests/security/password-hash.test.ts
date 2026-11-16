import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { DEFAULT_PBKDF2_ITERATIONS, hashPassword, needsRehash, verifyPassword } from "@/lib/password-hash";

const plain = {};
const peppered = { PASSWORD_PEPPER: "server-secret" };

describe("password hashing (CR-003)", () => {
  it("round-trips a PBKDF2 hash and rejects a wrong password", async () => {
    const stored = await hashPassword("correct horse battery", plain);
    expect(stored.startsWith(`pbkdf2-sha256$${DEFAULT_PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(await verifyPassword("correct horse battery", stored, plain)).toBe(true);
    expect(await verifyPassword("correct horse batterz", stored, plain)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same", plain)).not.toBe(await hashPassword("same", plain));
  });

  it("uses the pepper and fails without it", async () => {
    const stored = await hashPassword("pw-with-pepper", peppered);
    expect(stored.startsWith("pbkdf2-sha256p$")).toBe(true);
    expect(await verifyPassword("pw-with-pepper", stored, peppered)).toBe(true);
    expect(await verifyPassword("pw-with-pepper", stored, plain)).toBe(false);
    expect(await verifyPassword("pw-with-pepper", stored, { PASSWORD_PEPPER: "other" })).toBe(false);
  });

  it("still verifies legacy bcrypt hashes and asks for a rehash", async () => {
    const legacy = await bcrypt.hash("old-password", 4);
    expect(await verifyPassword("old-password", legacy, plain)).toBe(true);
    expect(await verifyPassword("wrong", legacy, plain)).toBe(false);
    expect(needsRehash(legacy, plain)).toBe(true);
  });

  it("asks for a rehash when iterations change or a pepper is added", async () => {
    const stored = await hashPassword("pw", plain);
    expect(needsRehash(stored, plain)).toBe(false);
    expect(needsRehash(stored, { PASSWORD_PBKDF2_ITERATIONS: "30000" })).toBe(true);
    expect(needsRehash(stored, peppered)).toBe(true);
  });

  it("rejects malformed stored values", async () => {
    for (const bad of ["", "nonsense", "pbkdf2-sha256$abc$x$y", "pbkdf2-sha256$999999$AAAA$AAAA"]) {
      expect(await verifyPassword("pw", bad, plain)).toBe(false);
    }
  });
});
