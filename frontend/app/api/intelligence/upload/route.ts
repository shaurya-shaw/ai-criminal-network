import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import {
  uploadIntelligenceFile,
  createDataSourceRecord,
  deleteStorageFile,
  processDataSourceDocument,
  createCaseInDb,
  updateCaseInDb,
  syncExtractedEntitiesToDb,
  syncExtractedAlertsToDb,
  DataSourceType,
} from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { EvidenceType, Priority } from "@/lib/api/types";

// Supported source types mapping
const ALLOWED_SOURCE_TYPES: DataSourceType[] = [
  "FIR",
  "CDR",
  "FINANCIAL",
  "SURVEILLANCE",
  "REPORT",
  "OSINT",
  "CUSTOMS",
  "OTHER",
];

// Normalize legacy/alternative source types to standard enum
function normalizeSourceType(raw: string): DataSourceType {
  const upper = (raw || "OTHER").toUpperCase().trim();
  if (upper === "CDRS") return "CDR";
  if (upper === "FINANCIAL_RECORD") return "FINANCIAL";
  if (upper === "SURVEILLANCE_REPORT") return "SURVEILLANCE";
  if (upper === "CUSTOMS_RECORD") return "CUSTOMS";
  if (ALLOWED_SOURCE_TYPES.includes(upper as DataSourceType)) {
    return upper as DataSourceType;
  }
  return "OTHER";
}

// Map source types to case evidence category types
const sourceTypeToEvidenceType: Record<DataSourceType, EvidenceType> = {
  FIR: "DOCUMENT",
  CDR: "COMMUNICATION",
  FINANCIAL: "FINANCIAL_RECORD",
  SURVEILLANCE: "MEDIA",
  REPORT: "DOCUMENT",
  OSINT: "DOCUMENT",
  CUSTOMS: "DOCUMENT",
  OTHER: "DOCUMENT",
};

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx", ".doc", ".csv", ".xlsx", ".xls", ".json"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  let uploadedStoragePath: string | null = null;

  try {
    // 1. Clerk Authentication Check
    const { userId } = await auth();
    const isClerkDev =
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

    if (!userId && !isClerkDev && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized. Please authenticate to ingest intelligence." },
        { status: 401 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let caseId = (formData.get("caseId") as string) || "";
    const rawSourceType = (formData.get("sourceType") as string) || "FIR";
    const sourceType = normalizeSourceType(rawSourceType);
    const title = (formData.get("title") as string) || file?.name || "Intelligence Document";
    const notes = (formData.get("notes") as string) || "";
    const newCaseName = formData.get("newCaseName") as string | null;
    const newCasePriority = (formData.get("newCasePriority") as Priority) || "HIGH";
    const newCaseJurisdiction = (formData.get("newCaseJurisdiction") as string) || "NATIONAL";

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please attach an intelligence document to upload." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the 50MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExt = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: `File type '${fileExt}' is not allowed. Supported formats: PDF, TXT, DOCX, CSV, XLSX.` },
        { status: 400 }
      );
    }

    // 3. Handle Case Selection / Creation ID
    const isNewCase = caseId === "NEW" || !caseId;
    let targetCase = !isNewCase ? dataStore.getCaseById(caseId) : undefined;
    if (isNewCase || !targetCase) {
      const newCaseIdx = dataStore.getAllCases().length + 90;
      caseId = `CASE-00${newCaseIdx}`;
    }

    const investigatorName = userId ? `AGENT-${userId.slice(-6).toUpperCase()}` : "LEAD INVESTIGATOR";

    // Ensure Parent Case exists in Supabase to satisfy foreign key (data_sources.case_id -> cases.id)
    try {
      await createCaseInDb({
        id: caseId,
        case_number: caseId,
        title: newCaseName || (targetCase?.name) || `Investigation // ${file.name.replace(/\.[^/.]+$/, "")}`,
        summary: notes || (targetCase?.description) || `Investigation initiated from ${sourceType} (${file.name}).`,
        priority: newCasePriority,
        investigator: investigatorName,
        jurisdiction: newCaseJurisdiction,
        status: "ACTIVE",
      });
    } catch (dbCaseErr) {
      console.warn("Pre-creating Supabase case note:", dbCaseErr);
    }

    // 4. Generate Unique Source ID and Storage Path
    const randomHex = crypto.randomBytes(4).toString("hex");
    const sourceId = `SRC-${randomHex}`;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `cases/${caseId}/${sourceType}/${sourceId}-${sanitizedFileName}`;

    // 5. Upload File to Supabase Storage
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);

    const uploadRes = await uploadIntelligenceFile({
      buffer,
      storagePath,
      contentType: file.type || "application/octet-stream",
    });

    if (!uploadRes.success) {
      return NextResponse.json(
        {
          error: "Failed to upload file to Supabase Storage.",
          details: uploadRes.error,
        },
        { status: 500 }
      );
    }

    uploadedStoragePath = storagePath;

    // 6. Insert Metadata Row into Postgres data_sources Table
    const dbRecordRes = await createDataSourceRecord({
      id: sourceId,
      case_id: caseId,
      filename: file.name,
      source_type: sourceType,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
      uploaded_by: userId || "OPERATOR",
      status: "UPLOADED",
    });

    if (!dbRecordRes.success) {
      console.error(
        `Postgres metadata insert failed for ${sourceId}. Rolling back storage upload for ${storagePath}...`
      );
      await deleteStorageFile(storagePath);

      return NextResponse.json(
        {
          error: "Failed to record data source metadata in database. Storage upload was rolled back.",
          details: dbRecordRes.error,
        },
        { status: 500 }
      );
    }

    // 7. Automatically Run Document Processing Pipeline (UPLOADED -> PROCESSING -> REVIEW)
    let finalStatus = "UPLOADED";
    let extractedData = null;
    try {
      const processRes = await processDataSourceDocument(sourceId);
      if (processRes.success && processRes.data) {
        finalStatus = "REVIEW";
        extractedData = processRes.data;
      }
    } catch (procErr) {
      console.warn("Background AI processing note:", procErr);
    }

    // 8. Create or Enrich Target Case in Data Store and Supabase Cases Table
    const sourceInfo = {
      id: sourceId,
      filename: file.name,
      storagePath,
      sourceType,
      fileSize: file.size,
    };

    if (isNewCase || !targetCase) {
      if (extractedData) {
        targetCase = dataStore.createCaseFromExtraction({
          id: caseId,
          name: newCaseName || undefined,
          priority: newCasePriority,
          investigator: investigatorName,
          jurisdiction: newCaseJurisdiction,
          extraction: extractedData,
          sourceInfo,
        });
      } else {
        targetCase = dataStore.createCase({
          id: caseId,
          name: newCaseName || `Investigation — ${file.name.replace(/\.[^/.]+$/, "")}`,
          description: notes || `Investigation initiated from ingested ${sourceType} material (${file.name}).`,
          priority: newCasePriority,
          investigator: investigatorName,
          jurisdiction: newCaseJurisdiction,
        });
      }
      caseId = targetCase.id;
    } else {
      if (extractedData) {
        targetCase = dataStore.enrichCaseWithExtraction(caseId, extractedData, sourceInfo) || targetCase;
      } else {
        const evidenceType = sourceTypeToEvidenceType[sourceType] || "DOCUMENT";
        targetCase.evidence.unshift({
          id: `EV-${sourceId.slice(4, 9).toUpperCase()}`,
          title: title,
          type: evidenceType,
          source: `Supabase Vault // ${sourceType}`,
          dateAdded: new Date().toISOString().split("T")[0],
          linkedEntities: [],
          description: `${notes ? notes + " — " : ""}Stored at ${storagePath} (${(file.size / 1024).toFixed(1)} KB)`,
        });
        targetCase.evidenceCount = targetCase.evidence.length;
      }
    }

    // Persist case-level summary / AI assessment to Supabase cases table
    try {
      await updateCaseInDb(caseId, {
        title: targetCase.name,
        summary: targetCase.brief || targetCase.description,
        ai_assessment: targetCase.aiAssessment,
        priority: targetCase.priority,
        jurisdiction: targetCase.jurisdiction,
        classification: targetCase.classification,
        investigator: targetCase.investigator,
        status: targetCase.status,
      });

      // Synchronize extracted entities to Supabase entities registry
      if (extractedData?.entities && Array.isArray(extractedData.entities)) {
        await syncExtractedEntitiesToDb(caseId, extractedData.entities);
      }

      // Synchronize extracted alerts to Supabase alerts feed
      if (extractedData?.alerts && Array.isArray(extractedData.alerts)) {
        await syncExtractedAlertsToDb(caseId, extractedData.alerts);
      }
    } catch (updateCaseErr) {
      console.warn("Supabase updateCaseInDb / syncExtractedEntitiesToDb / syncExtractedAlertsToDb note:", updateCaseErr);
    }



    // 9. Return Success Payload
    return NextResponse.json(
      {
        success: true,
        message: "Intelligence document ingested and metadata recorded successfully.",
        source: {
          id: sourceId,
          caseId: caseId,
          caseName: targetCase.name,
          filename: file.name,
          sourceType: sourceType,
          storagePath: storagePath,
          status: finalStatus,
          extractedData: extractedData,
          fileSize: file.size,
          mimeType: file.type,
          url: uploadRes.url,
          downloadUrl: uploadRes.downloadUrl,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedStoragePath) {
      try {
        await deleteStorageFile(uploadedStoragePath);
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json(
      {
        error: "Internal error processing intelligence upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
