/**
 * AcroForm inspector / filler, node-safe. Fills text, checkbox, radio,
 * dropdown and option-list fields with pdf-lib, then optionally flattens the
 * form so the values become part of the page and cannot be edited away.
 */
import {
  PDFButton,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
} from "pdf-lib";
import type {
  FormFieldInfo,
  FormFillInput,
  FormFillOutput,
  FormInspectInput,
  FormInspectOutput,
} from "../types";
import { assertNotCancelled, readPdfData, resetCancel, u8Part } from "../worker-shared";
import { hasPdfName } from "./pdf-scan";

export function inspectForm(doc: PDFDocument): FormFieldInfo[] {
  const form = doc.getForm();
  const out: FormFieldInfo[] = [];
  for (const field of form.getFields()) {
    // Real-world forms are messy: one unreadable field must not hide the rest.
    try {
      const base = { name: field.getName(), readOnly: field.isReadOnly() };
      if (field instanceof PDFTextField) {
        out.push({ ...base, type: "text", value: field.getText() ?? "" });
      } else if (field instanceof PDFCheckBox) {
        out.push({ ...base, type: "checkbox", value: field.isChecked() });
      } else if (field instanceof PDFRadioGroup) {
        out.push({ ...base, type: "radio", value: field.getSelected() ?? "", options: field.getOptions() });
      } else if (field instanceof PDFDropdown) {
        out.push({ ...base, type: "dropdown", value: field.getSelected(), options: field.getOptions() });
      } else if (field instanceof PDFOptionList) {
        out.push({ ...base, type: "optionlist", value: field.getSelected(), options: field.getOptions() });
      } else if (field instanceof PDFButton) {
        out.push({ ...base, type: "button", value: "" });
      } else if (field instanceof PDFSignature) {
        out.push({ ...base, type: "signature", value: "" });
      } else {
        out.push({ ...base, type: "unknown", value: "" });
      }
    } catch {
      /* skip only this field */
    }
  }
  return out;
}

export async function inspectFormMain(
  input: FormInspectInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<FormInspectOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const bytes = new Uint8Array(file);
  const doc = await PDFDocument.load(file, { ignoreEncryption: false });
  onProgress?.(1, "Read");
  return { pageCount: doc.getPageCount(), fields: inspectForm(doc), hasXfa: hasPdfName(bytes, "/XFA") };
}

function isOn(value: string | boolean | string[]): boolean {
  return value === true || value === "true" || value === "on" || value === "yes";
}

export async function fillFormMain(
  input: FormFillInput,
  onProgress?: (p: number, label?: string) => void,
): Promise<FormFillOutput> {
  resetCancel();
  const file = await readPdfData(input.file);
  const doc = await PDFDocument.load(file, { ignoreEncryption: false });
  const form = doc.getForm();
  const skipped: string[] = [];
  let filled = 0;

  for (const [name, value] of Object.entries(input.values)) {
    assertNotCancelled();
    let field: ReturnType<typeof form.getField>;
    try {
      field = form.getField(name);
    } catch {
      skipped.push(name);
      continue;
    }
    try {
      if (field instanceof PDFTextField) {
        field.setText(Array.isArray(value) ? value.join(", ") : String(value));
      } else if (field instanceof PDFCheckBox) {
        if (isOn(value)) field.check();
        else field.uncheck();
      } else if (field instanceof PDFRadioGroup || field instanceof PDFDropdown || field instanceof PDFOptionList) {
        const selected = Array.isArray(value) ? value[0] : String(value);
        if (selected) field.select(selected);
      } else {
        skipped.push(name);
        continue;
      }
      filled += 1;
      onProgress?.(filled / Math.max(1, Object.keys(input.values).length), "Filling");
    } catch {
      skipped.push(name);
    }
  }

  if (input.flatten) {
    assertNotCancelled();
    try {
      form.flatten();
    } catch {
      throw new Error("Some fields could not be flattened. Try again with flatten off.");
    }
  }
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), filled, skipped };
}
