import { describe, expect, it } from "vitest";
import { validateStep, toPayload, MAX_FILES, MAX_FILE_SIZE, MAX_IMAGE_SIZE, type QuoteData } from "@/lib/quote";

const base: QuoteData = {
  service: "clear", objectScope: "unit", objectType: "wohnung", cleanScope: "", buildScope: "", serviceType: "onetime",
  units: "1", area: "50", floor: "0", elevator: "no", distance: "",
  clearMode: "dispose", clearAreas: "living", livingArea: "50", livingFill: "normal", rooms: "2", kellerArea: "", kellerFill: "",
  atticArea: "", atticFill: "", garageArea: "", garageFill: "", officeArea: "", officeFill: "", disposeShare: "",
  newAddress: "", newFloor: "", newElevator: "", clearExtras: "",
  stairwells: "", storeys: "", stairFrequency: "", bins: "", sidewalk: "", gardenArea: "", interiorArea: "",
  interiorFrequency: "", windows: "", glassArea: "", windowFrequency: "",
  name: "Max", company: "", address: "Musterstr. 1", billingAddress: "", email: "a@b.de", phone: "", notes: "Bitte Angebot",
  privacy: true,
};
const building: QuoteData = { ...base, service: "clean", objectScope: "building", objectType: "mfh", serviceType: "", units: "", area: "", floor: "", elevator: "" };

describe("quote rules", () => {
  it("accepts a complete MOKA Clear disposal without distance or job type", () => {
    expect(validateStep(1, { ...base, serviceType: "", distance: "" }, [])).toEqual({});
  });
  it("asks area and fill level per chosen place", () => {
    const e = validateStep(1, { ...base, clearAreas: "living,keller", livingFill: "voll" }, []);
    expect(e.livingFill).toBe("livingFill");
    expect(e.kellerArea).toBe("kellerArea");
    expect(e.kellerFill).toBe("kellerFill");
    expect(validateStep(1, { ...base, clearAreas: "" }, []).clearAreas).toBe("clearAreas");
    expect(validateStep(1, { ...base, rooms: "" }, []).rooms).toBe("rooms");
  });
  it("asks the new address, its floor, elevator and distance for a move", () => {
    const e = validateStep(1, { ...base, clearMode: "move" }, []);
    expect(Object.keys(e).sort()).toEqual(["distance", "newAddress", "newElevator", "newFloor"]);
    expect(validateStep(1, { ...base, clearMode: "mixed", newAddress: "Neue Str. 2, 10115 Berlin", newFloor: "1", newElevator: "yes", distance: "8" }, []).disposeShare).toBe("disposeShare");
  });
  it("sends only the extras offered for the chosen mode", () => {
    expect(toPayload({ ...base, clearExtras: "heavy,montage,noParking" }).clearExtras).toBe("heavy,noParking");
    expect(toPayload({ ...base, clearMode: "move", clearExtras: "heavy,montage,noParking" }).clearExtras).toBe("heavy,montage");
    expect(toPayload({ ...base, serviceType: "" }).serviceType).toBe("onetime");
  });
  it("does not ask Clear details without MOKA Clear", () => {
    expect(validateStep(1, { ...base, service: "clean", clearMode: "", clearAreas: "" }, []).clearMode).toBeUndefined();
  });
  it("accepts several business units in one request", () => {
    expect(validateStep(0, { ...base, service: "clean,clear,build", cleanScope: "innen", buildScope: "renovierung" }, [])).toEqual({});
  });
  it("requires a Clean scope when Clean is one of several units", () => {
    expect(validateStep(0, { ...base, service: "clear,clean" }, []).cleanScope).toBe("cleanScope");
  });
  it("requires at least one unit", () => {
    expect(validateStep(0, { ...base, service: "" }, []).service).toBe("service");
  });
  it("asks whole building or single unit first, then a matching property type", () => {
    expect(validateStep(0, { ...base, objectScope: "" }, []).objectScope).toBe("objectScope");
    expect(validateStep(0, { ...base, objectScope: "building", objectType: "wohnung" }, []).objectType).toBe("objectType");
    expect(validateStep(0, { ...base, objectScope: "building", objectType: "efh" }, []).objectType).toBeUndefined();
  });
  it("offers building services only for a whole building", () => {
    // A single apartment has no stairwell of its own: the choice does not count.
    expect(validateStep(0, { ...base, service: "clean", cleanScope: "treppenhaus" }, []).cleanScope).toBe("cleanScope");
    expect(validateStep(0, { ...building, cleanScope: "treppenhaus" }, []).cleanScope).toBeUndefined();
    // A detached house has no shared stairwell either.
    expect(validateStep(0, { ...building, objectType: "efh", cleanScope: "treppenhaus" }, []).cleanScope).toBe("cleanScope");
  });
  it("does not ask job type, area, floor or elevator for MOKA Clean alone", () => {
    const e = validateStep(1, { ...building, cleanScope: "muell", bins: "4" }, []);
    expect(e).toEqual({});
  });
  it("asks the measure of each Clean service", () => {
    const e = validateStep(1, { ...building, cleanScope: "treppenhaus,muell,hausmeister,winter,garten,fenster" }, []);
    expect(Object.keys(e).sort()).toEqual(
      ["bins", "gardenArea", "sidewalk", "stairFrequency", "stairwells", "storeys", "units", "windowFrequency", "windows"].sort(),
    );
  });
  it("does not ask the number of units for the caretaker of a detached house", () => {
    expect(validateStep(1, { ...building, objectType: "efh", cleanScope: "hausmeister" }, []).units).toBeUndefined();
    expect(toPayload({ ...building, objectType: "efh", cleanScope: "hausmeister" }).units).toBe("1");
  });
  it("accepts windows or a glass area", () => {
    const w = { ...building, objectScope: "unit", objectType: "gewerbe", cleanScope: "fenster", windowFrequency: "once" };
    expect(validateStep(1, { ...w, windows: "0" }, []).windows).toBe("windows");
    expect(validateStep(1, { ...w, windows: "0", glassArea: "12" }, []).windows).toBeUndefined();
    expect(validateStep(1, { ...w, windows: "8" }, []).windows).toBeUndefined();
  });
  it("derives the job type for MOKA Clean and sends only valid services", () => {
    const unit = { ...building, objectScope: "unit", objectType: "wohnung" };
    expect(toPayload({ ...unit, cleanScope: "endreinigung" }).serviceType).toBe("onetime");
    expect(toPayload({ ...unit, cleanScope: "fenster", windowFrequency: "once" }).serviceType).toBe("onetime");
    expect(toPayload({ ...unit, cleanScope: "fenster", windowFrequency: "monthly" }).serviceType).toBe("recurring");
    expect(toPayload({ ...unit, cleanScope: "treppenhaus,innen" }).cleanScope).toBe("innen");
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
  it("treats the billing address as optional but complete when given", () => {
    expect(validateStep(2, base, []).billingAddress).toBeUndefined();
    expect(validateStep(2, { ...base, billingAddress: "abc" }, []).billingAddress).toBe("billingAddress");
    expect(validateStep(2, { ...base, billingAddress: "Kantstr. 5, 10623 Berlin" }, []).billingAddress).toBeUndefined();
  });
  it("requires privacy consent", () => {
    expect(validateStep(2, { ...base, privacy: false }, []).privacy).toBe("privacy");
  });
});
