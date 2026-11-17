import { describe, expect, it } from "vitest";
import { validateStep, MAX_FILES, MAX_FILE_SIZE, MAX_IMAGE_SIZE } from "@/lib/quote";

const base = {
  service: "clear", objectType: "wohnung", cleanScope: "", buildScope: "", serviceType: "onetime",
  units: "1", area: "50", floor: "0", elevator: "no", distance: "", fillLevel: "", name: "Max", company: "",
  address: "Musterstr. 1", email: "a@b.de", phone: "", notes: "Bitte Angebot", privacy: true,
};

describe("quote rules", () => {
  it("requires distance for MOKA Clear", () => {
    expect(validateStep(1, base, []).distance).toBe("distance");
  });
  it("requires a fill level for MOKA Clear", () => {
    expect(validateStep(1, base, []).fillLevel).toBe("fillLevel");
    expect(validateStep(1, { ...base, fillLevel: "voll" }, []).fillLevel).toBe("fillLevel");
    expect(validateStep(1, { ...base, fillLevel: "full" }, []).fillLevel).toBeUndefined();
  });
  it("does not ask for a fill level without MOKA Clear", () => {
    expect(validateStep(1, { ...base, service: "clean" }, []).fillLevel).toBeUndefined();
  });
  it("accepts several business units in one request", () => {
    expect(validateStep(0, { ...base, service: "clean,clear,build", cleanScope: "muell", buildScope: "renovierung" }, [])).toEqual({});
  });
  it("requires a Clean scope when Clean is one of several units", () => {
    expect(validateStep(0, { ...base, service: "clear,clean" }, []).cleanScope).toBe("cleanScope");
  });
  it("requires at least one unit", () => {
    expect(validateStep(0, { ...base, service: "" }, []).service).toBe("service");
  });
  it("allows at most 5 files of 5 MB", () => {
    expect(MAX_FILES).toBe(5);
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(validateStep(2, base, [{ size: MAX_FILE_SIZE + 1, type: "application/pdf" }]).files).toBe("fileSize");
  });
  it("accepts large photos, which are shrunk before sending", () => {
    expect(validateStep(2, base, [{ size: 12 * 1024 * 1024, type: "image/jpeg" }]).files).toBeUndefined();
    expect(validateStep(2, base, [{ size: MAX_IMAGE_SIZE + 1, type: "image/jpeg" }]).files).toBe("fileSize");
  });
  it("requires privacy consent", () => {
    expect(validateStep(2, { ...base, privacy: false }, []).privacy).toBe("privacy");
  });
});
