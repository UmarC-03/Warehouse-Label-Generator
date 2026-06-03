import { Order } from "../types";

const loadScript = (id: string, src: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any)[id] || document.getElementById(id)) {
      const checkExist = setInterval(() => {
        if ((window as any)[id]) {
          clearInterval(checkExist);
          resolve((window as any)[id]);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkExist);
        if ((window as any)[id]) resolve((window as any)[id]);
      }, 3000);
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.onload = () => {
      resolve((window as any)[id]);
    };
    script.onerror = (err) => {
      console.error(`Failed to load script ${src}`, err);
      reject(err);
    };
    document.head.appendChild(script);
  });
};

const loadPdfJS = async () => {
  await loadScript("pdfjsLib", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js");
  const pdfjsLib = (window as any).pdfjsLib;
  if (pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
  }
  return pdfjsLib;
};

const loadMammoth = async () => {
  return await loadScript("mammoth", "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
};

const loadXLSX = async () => {
  return await loadScript("XLSX", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
};

const extractPDFText = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJS();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n`;
  }
  return fullText;
};

const extractDocxText = async (file: File): Promise<string> => {
  await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
};

const extractExcelText = async (file: File): Promise<string> => {
  await loadXLSX();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = (window as any).XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  let text = "";

  workbook.SheetNames.forEach((sheetName: string) => {
    text += `--- Sheet: ${sheetName} ---\n`;
    const sheet = workbook.Sheets[sheetName];
    const csv = (window as any).XLSX.utils.sheet_to_csv(sheet);
    text += csv + "\n";
  });
  return text;
};

const extractPlainText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

export const parseDocumentFile = async (file: File): Promise<Order[]> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";

  if (extension === "pdf") {
    text = await extractPDFText(file);
  } else if (extension === "docx") {
    text = await extractDocxText(file);
  } else if (["xlsx", "xls", "csv", "ods"].includes(extension || "")) {
    text = await extractExcelText(file);
  } else {
    text = await extractPlainText(file);
  }

  if (!text || text.trim() === "") {
    throw new Error("Could not extract any readable text from this file.");
  }

  const response = await fetch("/api/parse-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server extraction failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !Array.isArray(result.orders)) {
    throw new Error("Invalid response format from extraction API");
  }

  return result.orders.map((rawOrder: any) => {
    const brand = rawOrder.brand ? String(rawOrder.brand).trim().toUpperCase() : "";
    const isHisense = brand === "HISENSE";
    const vatRate = isHisense ? 22 : 15;

    return {
      id: crypto.randomUUID(),
      heading: String(rawOrder.heading || "").toUpperCase(),
      brand,
      description: rawOrder.description ? String(rawOrder.description).toUpperCase() : "",
      categoryId: String(rawOrder.categoryId || "standard").toLowerCase(),
      quantity: Math.min(1000, Math.max(1, parseInt(rawOrder.quantity) || 1)),
      costPrice: Math.max(0, parseFloat(rawOrder.costPrice) || 0),
      vatRate,
      startFrom: 1,
      deliveryDate: rawOrder.deliveryDate || "",
    };
  });
};
