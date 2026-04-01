const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default;
const { AzureKeyCredential } = require("@azure/core-auth");

// Azure Document Intelligence credentials
const ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "https://dococrintel.cognitiveservices.azure.com/";
const API_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

/**
 * Process expense receipt using Azure Document Intelligence
 * @param {Buffer} fileBuffer - The receipt image/buffer
 * @returns {Promise<Object>} - Extracted receipt data
 */
async function processReceipt(fileBuffer) {
  if (!API_KEY) {
    throw new Error("Azure Document Intelligence API key is not configured");
  }

  const client = DocumentIntelligence(ENDPOINT, new AzureKeyCredential(API_KEY));

  // Use 'prebuilt-receipt' for common retail receipts
  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-receipt")
    .post({
      contentType: "application/octet-stream",
      body: fileBuffer,
    });

  if (initialResponse.status !== "202") {
    throw new Error(`Failed to start receipt analysis: ${initialResponse.status}`);
  }

  // Get the operation location URL for polling (headers is a plain object)
  const operationLocation = initialResponse.headers["operation-location"];
  
  if (!operationLocation) {
    throw new Error("Operation location not returned");
  }

  // Poll for results
  let resultResponse;
  let isComplete = false;

  while (!isComplete) {
    // Wait before polling (avoid rate limiting)
    await new Promise(resolve => setTimeout(resolve, 1000));

    resultResponse = await client.path(operationLocation).get();

    if (resultResponse.status === "200") {
      const status = resultResponse.body.status;
      if (status === "succeeded") {
        isComplete = true;
      } else if (status === "failed") {
        throw new Error("Receipt analysis failed");
      }
    }
  }

  // Extract receipt data
  const analyzeResult = resultResponse.body.analyzeResult;
  const documents = analyzeResult.documents;

  if (!documents || documents.length === 0) {
    throw new Error("No receipt data found in the image");
  }

  const receipt = documents[0].fields;

  // Extract items/line items if available
  const items = receipt.Items?.valueArray?.map(item => {
    const itemFields = item.valueObject;
    return {
      description: itemFields.Description?.valueString || "",
      quantity: itemFields.Quantity?.valueNumber || 1,
      price: itemFields.Price?.valueCurrency?.amount || 0,
      totalPrice: itemFields.TotalPrice?.valueCurrency?.amount || 0
    };
  }) || [];

  // Build extracted data object
  const extractedData = {
    merchant: receipt.MerchantName?.valueString || "",
    merchantAddress: receipt.MerchantAddress?.valueString || "",
    merchantPhone: receipt.MerchantPhoneNumber?.valuePhoneNumber || "",
    total: receipt.Total?.valueCurrency?.amount || 0,
    subtotal: receipt.Subtotal?.valueCurrency?.amount || 0,
    tax: receipt.TotalTax?.valueCurrency?.amount || 0,
    tip: receipt.Tip?.valueCurrency?.amount || 0,
    date: receipt.TransactionDate?.valueDate 
      ? new Date(receipt.TransactionDate.valueDate).toISOString() 
      : new Date().toISOString(),
    time: receipt.TransactionTime?.valueString || "",
    currency: receipt.Total?.valueCurrency?.currencyCode || "USD",
    items: items,
    confidence: documents[0].confidence || 0
  };

  return extractedData;
}

/**
 * Process invoice using Azure Document Intelligence
 * @param {Buffer} fileBuffer - The invoice image/buffer
 * @returns {Promise<Object>} - Extracted invoice data
 */
async function processInvoice(fileBuffer) {
  if (!API_KEY) {
    throw new Error("Azure Document Intelligence API key is not configured");
  }

  const client = DocumentIntelligence(ENDPOINT, new AzureKeyCredential(API_KEY));

  // Use 'prebuilt-invoice' for professional service bills
  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-invoice")
    .post({
      contentType: "application/octet-stream",
      body: fileBuffer,
    });

  if (initialResponse.status !== "202") {
    throw new Error(`Failed to start invoice analysis: ${initialResponse.status}`);
  }

  // Get the operation location URL for polling (headers is a plain object)
  const operationLocation = initialResponse.headers["operation-location"];
  
  if (!operationLocation) {
    throw new Error("Operation location not returned");
  }

  // Poll for results
  let resultResponse;
  let isComplete = false;

  while (!isComplete) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    resultResponse = await client.path(operationLocation).get();

    if (resultResponse.status === "200") {
      const status = resultResponse.body.status;
      if (status === "succeeded") {
        isComplete = true;
      } else if (status === "failed") {
        throw new Error("Invoice analysis failed");
      }
    }
  }

  // Extract invoice data
  const analyzeResult = resultResponse.body.analyzeResult;
  const documents = analyzeResult.documents;

  if (!documents || documents.length === 0) {
    throw new Error("No invoice data found in the image");
  }

  const invoice = documents[0].fields;
  // Extract line items
  const items = invoice.Items?.valueArray?.map(item => {
    const itemFields = item.valueObject;
    return {
      description: itemFields.Description?.valueString || "",
      quantity: itemFields.Quantity?.valueNumber || 1,
      unitPrice: itemFields.UnitPrice?.valueCurrency?.amount || 0,
      amount: itemFields.Amount?.valueCurrency?.amount || 0
    };
  }) || [];

  // Build extracted data object
  const extractedData = {
    vendor: invoice.VendorName?.valueString || "",
    vendorAddress: invoice.VendorAddress?.valueString || "",
    customerName: invoice.CustomerName?.valueString || "",
    customerAddress: invoice.CustomerAddress?.valueString || "",
    invoiceId: invoice.InvoiceId?.valueString || "",
    total: invoice.InvoiceTotal?.valueCurrency?.amount || 0,
    subtotal: invoice.SubTotal?.valueCurrency?.amount || 0,
    tax: invoice.TotalTax?.valueCurrency?.amount || 0,
    dueDate: invoice.DueDate?.valueDate 
      ? new Date(invoice.DueDate.valueDate).toISOString() 
      : null,
    invoiceDate: invoice.InvoiceDate?.valueDate 
      ? new Date(invoice.InvoiceDate.valueDate).toISOString() 
      : new Date().toISOString(),
    currency: invoice.InvoiceTotal?.valueCurrency?.currencyCode || "USD",
    items: items,
    confidence: documents[0].confidence || 0
  };

  return extractedData;
}

module.exports = {
  processReceipt,
  processInvoice
};
