import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadIntelligenceFile } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { EvidenceType, Priority } from "@/lib/api/types";

// Map source types to evidence category types
const sourceTypeToEvidenceType: Record<string, EvidenceType> = {
  FIR: "DOCUMENT",
  CDRS: "COMMUNICATION",
  FINANCIAL_RECORD: "FINANCIAL_RECORD",
  SURVEILLANCE_REPORT: "MEDIA",
  OSINT: "DOCUMENT",
  CUSTOMS_RECORD: "DOCUMENT",
  OTHER: "DOCUMENT",
};

export async function POST(request: NextRequest) {
  try {
    // 1. Clerk Authentication Check
    const { userId } = await auth();
    const isClerkDev = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");
    
    // In production or configured Clerk, enforce auth
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
    const sourceType = (formData.get("sourceType") as string) || "FIR";
    const title = (formData.get("title") as string) || file?.name || "Intelligence Document";
    const notes = (formData.get("notes") as string) || "";
    const newCaseName = formData.get("newCaseName") as string | null;
    const newCasePriority = (formData.get("newCasePriority") as Priority) || "HIGH";
    const newCaseJurisdiction = (formData.get("newCaseJurisdiction") as string) || "NATIONAL";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please attach an intelligence document to upload." },
        { status: 400 }
      );
    }

    // 3. Handle Case Selection / Creation
    let targetCase = caseId && caseId !== "NEW" ? dataStore.getCaseById(caseId) : undefined;

    if (caseId === "NEW" || !targetCase) {
      const caseName = newCaseName || `Investigation — ${file.name.replace(/\.[^/.]+$/, "")}`;
      targetCase = dataStore.createCase({
        name: caseName,
        description: notes || `Investigation initiated from ingested ${sourceType} material (${file.name}).`,
        priority: newCasePriority,
        investigator: userId ? `AGENT-${userId.slice(-6).toUpperCase()}` : "LEAD INVESTIGATOR",
        jurisdiction: newCaseJurisdiction,
      });
      caseId = targetCase.id;
    }

    // 4. Sanitize file name and construct storage path
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `cases/${caseId}/${sourceType}/${timestamp}-${sanitizedFileName}`;

    // 5. Convert File to Buffer and Upload to Supabase
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
          error: "Failed to upload to Supabase Storage",
          details: uploadRes.error,
        },
        { status: 500 }
      );
    }

    // 6. Record Evidence & Timeline in Data Store
    const evidenceType = sourceTypeToEvidenceType[sourceType] || "DOCUMENT";
    const evidenceId = `EV-${String(targetCase.evidence.length + 1).padStart(3, "0")}`;

    targetCase.evidence.unshift({
      id: evidenceId,
      title: title,
      type: evidenceType,
      source: `Supabase Vault // ${sourceType}`,
      dateAdded: new Date().toISOString().split("T")[0],
      linkedEntities: [],
      description: `${notes ? notes + " — " : ""}Stored at ${storagePath} (${(file.size / 1024).toFixed(1)} KB)`,
    });
    targetCase.evidenceCount = targetCase.evidence.length;

    targetCase.timeline.unshift({
      id: `T-${Date.now().toString().slice(-4)}`,
      timestamp: `${new Date().toISOString().replace("T", " ").slice(0, 16)}`,
      title: `Intelligence Ingested: ${title}`,
      description: `Ingested ${sourceType} file (${file.name}) to secure storage at ${storagePath}.`,
      type: "INTEL",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Intelligence file ingested successfully.",
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          sourceType,
          storagePath: uploadRes.path || storagePath,
          url: uploadRes.url,
          bucket: uploadRes.bucket,
        },
        case: {
          id: targetCase.id,
          name: targetCase.name,
          priority: targetCase.priority,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error processing intelligence upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
