import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Environment Configuration ───────────────────────────────────────────────

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  "";

export const DEFAULT_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "intelligence-files";

// ─── Server-Side Admin Client ────────────────────────────────────────────────

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error(
      "Supabase credentials missing. Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file.",
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

import { IntelligenceExtractionResult, ExtractedEntity, ExtractedAlert } from "@/lib/ai/types";
import { extractIntelligenceWithGemini } from "@/lib/ai/gemini-extractor";


// ─── Data Types ──────────────────────────────────────────────────────────────

export type DataSourceStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "REVIEW"
  | "IMPORTED"
  | "FAILED";

export type DataSourceType =
  | "FIR"
  | "CDR"
  | "FINANCIAL"
  | "SURVEILLANCE"
  | "REPORT"
  | "OSINT"
  | "CUSTOMS"
  | "OTHER";

export interface DataSourceRecord {
  id: string;
  case_id: string;
  filename: string;
  source_type: DataSourceType;
  storage_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  uploaded_by?: string | null;
  status: DataSourceStatus;
  extracted_data?: IntelligenceExtractionResult | null;
  uploaded_at: string;
  updated_at: string;
  // Enriched presentation fields
  url?: string;
  downloadUrl?: string;
  formattedSize?: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Storage Bucket Auto-Provisioning ─────────────────────────────────────────

export async function ensureBucketExists(
  bucketName: string = DEFAULT_STORAGE_BUCKET,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // Check if bucket already exists
    const { data: bucket, error: getError } =
      await supabase.storage.getBucket(bucketName);
    if (bucket && !getError) {
      return { success: true };
    }

    // Try creating bucket with default size limit
    const { error: createError } = await supabase.storage.createBucket(
      bucketName,
      {
        public: false,
      },
    );

    if (
      createError &&
      !createError.message.includes("already exists") &&
      !createError.message.includes("Duplicate")
    ) {
      console.warn(
        `Supabase createBucket note for '${bucketName}':`,
        createError.message,
      );
      return { success: false, error: createError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("ensureBucketExists caught error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── File Upload & Storage Management ────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  downloadUrl?: string;
  bucket?: string;
  size?: number;
  error?: string;
}

export async function uploadIntelligenceFile(params: {
  buffer: Buffer;
  storagePath: string;
  contentType: string;
  bucketName?: string;
}): Promise<UploadResult> {
  const {
    buffer,
    storagePath,
    contentType,
    bucketName = DEFAULT_STORAGE_BUCKET,
  } = params;

  try {
    const supabase = getSupabaseAdminClient();

    // Ensure bucket exists before upload
    await ensureBucketExists(bucketName);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      let friendlyError = error.message;
      if (error.message.includes("Bucket not found")) {
        friendlyError = `Supabase Storage Bucket '${bucketName}' does not exist yet. Please create a bucket named '${bucketName}' in your Supabase Dashboard -> Storage (or set SUPABASE_STORAGE_BUCKET in .env).`;
      }
      return {
        success: false,
        error: friendlyError,
      };
    }

    // Get signed URL for preview (valid for 24 hours)
    let signedUrl = "";
    let downloadSignedUrl = "";
    try {
      const { data: signedData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 86400);
      signedUrl = signedData?.signedUrl || "";

      const cleanFileName = storagePath.split("/").pop() || "download";
      const { data: downloadData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 86400, { download: cleanFileName });
      downloadSignedUrl = downloadData?.signedUrl || signedUrl;
    } catch {
      // Signed URL failure is non-fatal
    }

    return {
      success: true,
      path: data.path,
      url: signedUrl,
      downloadUrl: downloadSignedUrl,
      bucket: bucketName,
      size: buffer.byteLength,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteStorageFile(
  storagePath: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) {
      console.error(`Failed to cleanup storage file ${storagePath}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error(`deleteStorageFile caught error for ${storagePath}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function downloadStorageFile(
  storagePath: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "File download failed from Supabase Storage",
      };
    }

    const arrayBuffer = await data.arrayBuffer();
    return { success: true, buffer: Buffer.from(arrayBuffer) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteDataSourceRecord(
  id: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch record to get storage_path
    const { data: record } = await supabase
      .from("data_sources")
      .select("storage_path")
      .eq("id", id)
      .single();

    // 2. Delete from Postgres
    const { error: dbError } = await supabase
      .from("data_sources")
      .delete()
      .eq("id", id);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 3. Delete from Supabase Storage if path exists
    if (record?.storage_path) {
      await supabase.storage.from(bucketName).remove([record.storage_path]);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Postgres Metadata CRUD Helpers ──────────────────────────────────────────

export async function updateDataSourceStatus(
  id: string,
  status: DataSourceStatus,
  extractedData?: IntelligenceExtractionResult | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (extractedData !== undefined) {
      updatePayload.extracted_data = extractedData;
    }

    const { error } = await supabase
      .from("data_sources")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      // If error is due to extracted_data column not created yet, retry updating status only
      if (
        (error.message.includes("extracted_data") || error.code === "PGRST204") &&
        updatePayload.extracted_data !== undefined
      ) {
        console.warn("Retrying status update without extracted_data column:", error.message);
        const retryRes = await supabase
          .from("data_sources")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (!retryRes.error) {
          return { success: true };
        }
      }

      console.error(`updateDataSourceStatus failed for ${id}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function processDataSourceDocument(
  sourceId: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{ success: boolean; data?: IntelligenceExtractionResult; error?: string }> {
  try {
    // 1. Fetch metadata
    const sourceRes = await fetchDataSourceById(sourceId, bucketName);
    if (!sourceRes.success || !sourceRes.source) {
      return { success: false, error: sourceRes.error || "Data source not found" };
    }
    const source = sourceRes.source;

    // 2. Mark as PROCESSING
    await updateDataSourceStatus(sourceId, "PROCESSING");

    // 3. Download file buffer
    const downloadRes = await downloadStorageFile(source.storage_path, bucketName);
    if (!downloadRes.success || !downloadRes.buffer) {
      await updateDataSourceStatus(sourceId, "FAILED");
      return { success: false, error: downloadRes.error || "Failed to read storage file" };
    }

    // 4. Run Gemini extraction
    const extraction = await extractIntelligenceWithGemini({
      buffer: downloadRes.buffer,
      mimeType: source.mime_type || "application/pdf",
      filename: source.filename,
      caseId: source.case_id,
      sourceType: source.source_type,
    });

    // 5. Update Postgres record with REVIEW status and extracted_data
    const updateRes = await updateDataSourceStatus(sourceId, "REVIEW", extraction);
    if (!updateRes.success) {
      console.warn("Failed to persist extraction JSONB in Postgres:", updateRes.error);
    }

    return { success: true, data: extraction };
  } catch (err) {
    await updateDataSourceStatus(sourceId, "FAILED");
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createDataSourceRecord(
  record: {
    id: string;
    case_id: string;
    filename: string;
    source_type: DataSourceType;
    storage_path: string;
    mime_type?: string | null;
    file_size?: number | null;
    uploaded_by?: string | null;
    status?: DataSourceStatus;
  }
): Promise<{ success: boolean; data?: DataSourceRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    const insertPayload = {
      id: record.id,
      case_id: record.case_id,
      filename: record.filename,
      source_type: record.source_type,
      storage_path: record.storage_path,
      mime_type: record.mime_type || null,
      file_size: record.file_size || 0,
      uploaded_by: record.uploaded_by || null,
      status: record.status || "UPLOADED",
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("data_sources")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      let friendlyError = error.message;
      if (
        error.message.includes("relation \"public.data_sources\" does not exist") ||
        error.message.includes("Could not find the table") ||
        error.message.includes("schema cache") ||
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.code === "PGRST200"
      ) {
        friendlyError =
          "Postgres table 'public.data_sources' has not been created yet. Please run the SQL in 'frontend/lib/supabase/schema.sql' inside your Supabase SQL Editor.";
      }
      console.error("Failed to insert data_sources row in Postgres:", friendlyError);
      return { success: false, error: friendlyError };
    }

    return { success: true, data: data as DataSourceRecord };
  } catch (err) {
    console.error("createDataSourceRecord caught error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchDataSources(
  filter?: {
    caseId?: string;
    sourceType?: string;
    status?: string;
  },
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{
  success: boolean;
  sources: DataSourceRecord[];
  total: number;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("data_sources")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (filter?.caseId) {
      query = query.eq("case_id", filter.caseId);
    }
    if (filter?.sourceType && filter.sourceType !== "ALL") {
      query = query.eq("source_type", filter.sourceType);
    }
    if (filter?.status && filter.status !== "ALL") {
      query = query.eq("status", filter.status);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet in Supabase Postgres, gracefully fall back to storage scanner
      if (
        error.message.includes("relation \"public.data_sources\" does not exist") ||
        error.message.includes("Could not find the table") ||
        error.message.includes("schema cache") ||
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.code === "PGRST200"
      ) {
        console.warn("Postgres table 'data_sources' not yet provisioned. Falling back to Supabase Storage scanner.");
        const fallback = await listAllIntelligenceFiles(bucketName);
        const mappedSources: DataSourceRecord[] = fallback.files.map((f) => ({
          id: f.id,
          case_id: f.caseId,
          filename: f.name,
          source_type: (f.sourceType as DataSourceType) || "OTHER",
          storage_path: f.storagePath,
          mime_type: null,
          file_size: f.size,
          uploaded_by: null,
          status: "UPLOADED",
          uploaded_at: f.uploadedAt,
          updated_at: f.uploadedAt,
          url: f.url,
          downloadUrl: f.downloadUrl,
          formattedSize: f.formattedSize,
        }));

        let filtered = mappedSources;
        if (filter?.caseId) {
          filtered = filtered.filter((s) => s.case_id === filter.caseId);
        }
        if (filter?.sourceType && filter.sourceType !== "ALL") {
          filtered = filtered.filter((s) => s.source_type === filter.sourceType);
        }
        return { success: true, sources: filtered, total: filtered.length };
      }

      return { success: false, sources: [], total: 0, error: error.message };
    }

    const rows = (data || []) as DataSourceRecord[];

    // Enrich rows with 24-hour signed URLs
    const enrichedSources: DataSourceRecord[] = await Promise.all(
      rows.map(async (row) => {
        let url = "";
        let downloadUrl = "";
        try {
          const { data: signedData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(row.storage_path, 86400);
          url = signedData?.signedUrl || "";

          const { data: downloadData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(row.storage_path, 86400, { download: row.filename });
          downloadUrl = downloadData?.signedUrl || url;
        } catch {
          // Signed URL failure is non-fatal
        }

        return {
          ...row,
          url,
          downloadUrl,
          formattedSize: formatBytes(row.file_size || 0),
        };
      })
    );

    return {
      success: true,
      sources: enrichedSources,
      total: enrichedSources.length,
    };
  } catch (err) {
    return {
      success: false,
      sources: [],
      total: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchDataSourceById(
  id: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{
  success: boolean;
  source?: DataSourceRecord;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (
        error.message.includes("relation \"public.data_sources\" does not exist") ||
        error.message.includes("Could not find the table") ||
        error.message.includes("schema cache") ||
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.code === "PGRST200"
      ) {
        const fallback = await listAllIntelligenceFiles(bucketName);
        const match = fallback.files.find((f) => f.id === id || f.storagePath.includes(id));
        if (match) {
          return {
            success: true,
            source: {
              id: match.id,
              case_id: match.caseId,
              filename: match.name,
              source_type: (match.sourceType as DataSourceType) || "OTHER",
              storage_path: match.storagePath,
              mime_type: null,
              file_size: match.size,
              uploaded_by: null,
              status: "UPLOADED",
              uploaded_at: match.uploadedAt,
              updated_at: match.uploadedAt,
              url: match.url,
              downloadUrl: match.downloadUrl,
              formattedSize: match.formattedSize,
            },
          };
        }
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Data source not found" };
    }

    const row = data as DataSourceRecord;
    let url = "";
    let downloadUrl = "";

    try {
      const { data: signedData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(row.storage_path, 86400);
      url = signedData?.signedUrl || "";

      const { data: downloadData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(row.storage_path, 86400, { download: row.filename });
      downloadUrl = downloadData?.signedUrl || url;
    } catch {
      // Non-fatal
    }

    return {
      success: true,
      source: {
        ...row,
        url,
        downloadUrl,
        formattedSize: formatBytes(row.file_size || 0),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Legacy Storage Scanner (Fallback) ───────────────────────────────────────

export interface UploadedIntelligenceFile {
  id: string;
  name: string;
  rawName: string;
  caseId: string;
  sourceType: string;
  size: number;
  formattedSize: string;
  storagePath: string;
  url: string;
  downloadUrl: string;
  uploadedAt: string;
}

export async function listAllIntelligenceFiles(
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{
  success: boolean;
  files: UploadedIntelligenceFile[];
  totalBytes: number;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    const allFiles: UploadedIntelligenceFile[] = [];
    let totalBytes = 0;

    const { data: caseFolders, error: caseFoldersError } = await supabase.storage
      .from(bucketName)
      .list("cases", { limit: 100 });

    if (caseFoldersError) {
      if (caseFoldersError.message.includes("Bucket not found")) {
        return { success: true, files: [], totalBytes: 0 };
      }
      return { success: false, files: [], totalBytes: 0, error: caseFoldersError.message };
    }

    if (!caseFolders || caseFolders.length === 0) {
      return { success: true, files: [], totalBytes: 0 };
    }

    for (const caseFolder of caseFolders) {
      const caseId = caseFolder.name;
      if (caseId.startsWith(".")) continue;

      const { data: sourceFolders } = await supabase.storage
        .from(bucketName)
        .list(`cases/${caseId}`, { limit: 50 });

      if (!sourceFolders || sourceFolders.length === 0) continue;

      for (const sourceFolder of sourceFolders) {
        const sourceType = sourceFolder.name;
        if (sourceType.startsWith(".")) continue;

        const { data: fileObjects } = await supabase.storage
          .from(bucketName)
          .list(`cases/${caseId}/${sourceType}`, {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!fileObjects || fileObjects.length === 0) continue;

        for (const fileObj of fileObjects) {
          if (fileObj.name.startsWith(".")) continue;

          const rawName = fileObj.name;
          const storagePath = `cases/${caseId}/${sourceType}/${rawName}`;
          const size = fileObj.metadata?.size || 0;
          totalBytes += size;

          const cleanName = rawName.replace(/^SRC-[a-zA-Z0-9]+-/, "").replace(/^\d+-/, "");

          let url = "";
          let downloadUrl = "";

          try {
            const { data: signedData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 86400);
            url = signedData?.signedUrl || "";

            const { data: downloadSignedData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 86400, { download: cleanName });
            downloadUrl = downloadSignedData?.signedUrl || url;
          } catch {
            // Non-fatal
          }

          allFiles.push({
            id: fileObj.id || storagePath,
            name: cleanName,
            rawName: rawName,
            caseId: caseId,
            sourceType: sourceType,
            size: size,
            formattedSize: formatBytes(size),
            storagePath: storagePath,
            url: url,
            downloadUrl: downloadUrl,
            uploadedAt: fileObj.created_at || fileObj.updated_at || new Date().toISOString(),
          });
        }
      }
    }

    allFiles.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return {
      success: true,
      files: allFiles,
      totalBytes,
    };
  } catch (err) {
    return {
      success: false,
      files: [],
      totalBytes: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Supabase Cases CRUD & Document Aggregation ───────────────────────────────

import type {
  CaseDetail,
  CaseSummary,
  CaseStatus,
  Priority,
  CaseEntity,
  TimelineEvent,
  Evidence,
  CaseAlert,
  CaseNetwork,
  EntityType,
  TimelineEventType,
  EvidenceType,
  EntityStatus,
  AlertSeverity,
  AlertStatus,
  OverviewTelemetry,
  GlobalAlert,
  ActivityLog,
} from "@/lib/api/types";


export interface CaseRecord {
  id: string;
  case_number: string;
  title: string;
  summary?: string | null;
  classification?: string | null;
  ai_assessment?: {
    finding: string;
    confidence: number;
    category: string;
  } | null;
  status: CaseStatus;
  priority: Priority;
  investigator?: string | null;
  jurisdiction?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Reads the immutable source material used to build a case graph.  This does
 * not synthesize or fall back to the local dashboard store: Supabase JSONB is
 * the sole input for Neo4j projection.
 */
export async function fetchCaseGraphInputFromDb(
  caseId: string,
): Promise<{
  success: boolean;
  case?: CaseRecord;
  sources: DataSourceRecord[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    let caseRecord: CaseRecord | undefined;

    // 1. Try fetching from cases table
    try {
      const { data: caseRow, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .or(`id.eq.${caseId},case_number.eq.${caseId}`)
        .single();

      if (!caseError && caseRow) {
        caseRecord = caseRow as CaseRecord;
      }
    } catch {
      // Non-fatal, fallback to data_sources
    }

    // 2. Fetch data_sources for this case
    let sources: DataSourceRecord[] = [];
    try {
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("data_sources")
        .select("*")
        .eq("case_id", caseId)
        .order("uploaded_at", { ascending: true });

      if (!sourcesError && sourcesData) {
        sources = sourcesData as DataSourceRecord[];
      }
    } catch {
      // Non-fatal
    }

    // 3. Synthesize CaseRecord if not present in cases table
    if (!caseRecord) {
      const firstSrc = sources[0];
      const ext = firstSrc?.extracted_data as any;
      const title = ext?.caseTitle || (firstSrc?.filename ? `Case ${caseId} (${firstSrc.filename})` : `Investigation ${caseId}`);
      const summary = ext?.summary || `Case investigation graph for ${caseId}.`;

      caseRecord = {
        id: caseId,
        case_number: caseId,
        title,
        summary,
        classification: "RESTRICTED // LEVEL-3",
        status: "ACTIVE",
        priority: "HIGH",
        investigator: "LEAD INVESTIGATOR",
        created_at: firstSrc?.uploaded_at || new Date().toISOString(),
        updated_at: firstSrc?.updated_at || new Date().toISOString(),
      };
    }

    return {
      success: true,
      case: caseRecord,
      sources,
    };
  } catch (err) {
    return {
      success: false,
      sources: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function mapExtractedEntityType(rawType?: string): EntityType {
  const upper = (rawType || "Person").toUpperCase();
  if (upper === "PERSON") return "PERSON";
  if (upper === "ORGANIZATION") return "ORGANIZATION";
  if (upper === "LOCATION") return "LOCATION";
  if (upper === "PHONE") return "PHONE";
  if (upper === "BANKACCOUNT" || upper === "ACCOUNT") return "ACCOUNT";
  if (upper === "VEHICLE") return "VEHICLE";
  return "PERSON";
}

function mapExtractedTimelineType(rawType?: string): TimelineEventType {
  const upper = (rawType || "INTEL").toUpperCase();
  if (["SURVEILLANCE", "FINANCIAL", "COMMUNICATION", "ARREST", "INTEL", "SYSTEM"].includes(upper)) {
    return upper as TimelineEventType;
  }
  if (upper.includes("CALL") || upper.includes("COMM")) return "COMMUNICATION";
  if (upper.includes("BANK") || upper.includes("CASH") || upper.includes("TRANS")) return "FINANCIAL";
  if (upper.includes("RAID") || upper.includes("ARREST") || upper.includes("SEIZ")) return "ARREST";
  if (upper.includes("SIGHT") || upper.includes("CCTV") || upper.includes("SURV")) return "SURVEILLANCE";
  return "INTEL";
}

function mapSourceToEvidenceType(sourceType: string): EvidenceType {
  const upper = (sourceType || "OTHER").toUpperCase();
  if (upper === "FIR" || upper === "REPORT" || upper === "OSINT" || upper === "CUSTOMS") return "DOCUMENT";
  if (upper === "CDR") return "COMMUNICATION";
  if (upper === "FINANCIAL") return "FINANCIAL_RECORD";
  if (upper === "SURVEILLANCE") return "MEDIA";
  return "DOCUMENT";
}

export async function createCaseInDb(params: {
  id?: string;
  case_number?: string;
  title: string;
  summary?: string;
  classification?: string;
  ai_assessment?: any;
  status?: CaseStatus;
  priority?: Priority;
  investigator?: string;
  jurisdiction?: string;
}): Promise<{ success: boolean; data?: CaseRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const caseId = params.id || `CASE-00${Date.now().toString().slice(-4)}`;
    const caseNumber = params.case_number || caseId;

    const payload = {
      id: caseId,
      case_number: caseNumber,
      title: params.title,
      summary: params.summary || `Case initialized for investigation.`,
      classification: params.classification || "RESTRICTED // LEVEL-3",
      ai_assessment: params.ai_assessment || {
        finding: "Initial reconnaissance active. Awaiting evidence ingestion.",
        confidence: 75,
        category: "NEW INGESTION",
      },
      status: params.status || "ACTIVE",
      priority: params.priority || "HIGH",
      investigator: params.investigator || "LEAD INVESTIGATOR",
      jurisdiction: params.jurisdiction || "NATIONAL",
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("cases")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("createCaseInDb error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateCaseInDb(
  id: string,
  updates: Partial<CaseRecord>
): Promise<{ success: boolean; data?: CaseRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("cases")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchCasesFromDb(options?: {
  status?: CaseStatus | "ALL";
  search?: string;
}): Promise<{ success: boolean; cases: CaseSummary[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("cases")
      .select("*, data_sources(id, extracted_data)")
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "ALL") {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) {
      // If cases table doesn't exist yet, return clean empty
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return { success: true, cases: [] };
      }
      return { success: false, cases: [], error: error.message };
    }

    let summaries: CaseSummary[] = (data || []).map((row: any) => {
      // Calculate entity and network counts from attached data_sources
      const sources = row.data_sources || [];
      const entityMap = new Set<string>();
      let relationshipCount = 0;

      for (const src of sources) {
        if (src.extracted_data?.entities) {
          for (const ent of src.extracted_data.entities) {
            if (ent.name) entityMap.add(ent.name.toLowerCase().trim());
          }
        }
        if (src.extracted_data?.relationships) {
          relationshipCount += src.extracted_data.relationships.length;
        }
      }

      return {
        id: row.id,
        name: row.title,
        status: row.status,
        priority: row.priority || "HIGH",
        entities: entityMap.size,
        networks: entityMap.size > 0 ? 1 : 0,
        investigator: row.investigator || "LEAD INVESTIGATOR",
        opened: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        updated: row.updated_at ? "Recently" : "Just now",
        description: row.summary || "",
      };
    });

    if (options?.search) {
      const q = options.search.toLowerCase();
      summaries = summaries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.investigator.toLowerCase().includes(q)
      );
    }

    return { success: true, cases: summaries };
  } catch (err) {
    return {
      success: false,
      cases: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchCaseDetailByIdFromDb(
  caseId: string
): Promise<{ success: boolean; data?: CaseDetail; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch case row
    const { data: caseRow, error: caseErr } = await supabase
      .from("cases")
      .select("*")
      .or(`id.eq.${caseId},case_number.eq.${caseId}`)
      .single();

    if (caseErr || !caseRow) {
      return {
        success: false,
        error: caseErr?.message || `Case '${caseId}' not found in database`,
      };
    }

    // 2. Fetch all data_sources for this case
    const { data: dataSources, error: dsErr } = await supabase
      .from("data_sources")
      .select("*")
      .eq("case_id", caseRow.id)
      .order("uploaded_at", { ascending: true });

    if (dsErr) {
      console.warn("fetchCaseDetailByIdFromDb data_sources error:", dsErr.message);
    }

    const sources = dataSources || [];
    const today = new Date().toISOString().split("T")[0];

    // 3. Aggregate unique entities across all data_sources
    const entityMap = new Map<string, CaseEntity>();
    let totalRelationships = 0;
    const timelineEvents: TimelineEvent[] = [
      {
        id: "T-001",
        timestamp: `${caseRow.created_at ? caseRow.created_at.split("T")[0] : today} 09:00`,
        title: "Case Initialized",
        description: `Case ${caseRow.id} assigned to ${caseRow.investigator || "LEAD INVESTIGATOR"}.`,
        type: "SYSTEM",
      },
    ];
    const evidenceItems: Evidence[] = [];
    const caseAlerts: CaseAlert[] = [];

    // Collect from each data source's extracted_data
    sources.forEach((src, sIdx) => {
      const ext = src.extracted_data as IntelligenceExtractionResult | undefined;
      const fileEvidenceType = mapSourceToEvidenceType(src.source_type);

      // Primary document evidence item
      evidenceItems.push({
        id: `EV-${src.id.slice(4, 9).toUpperCase() || String(sIdx + 1).padStart(3, "0")}`,
        title: `${src.source_type}: ${src.filename}`,
        type: fileEvidenceType,
        source: `Supabase Vault // ${src.source_type}`,
        dateAdded: src.uploaded_at ? src.uploaded_at.split("T")[0] : today,
        linkedEntities: [],
        description: `Ingested document (${formatBytes(src.file_size || 0)}). Storage: ${src.storage_path}. Status: ${src.status}.`,
      });

      if (ext) {
        // Aggregate entities
        if (ext.entities && Array.isArray(ext.entities)) {
          ext.entities.forEach((ent, eIdx) => {
            if (!ent.name) return;
            const key = ent.name.toLowerCase().trim();
            const mappedType = mapExtractedEntityType(ent.type);
            const score = typeof ent.riskScore === "number" ? ent.riskScore : 70;
            const status: EntityStatus = score >= 75 ? "FLAGGED" : score >= 40 ? "MONITORING" : "CLEARED";

            if (entityMap.has(key)) {
              const existing = entityMap.get(key)!;
              existing.riskScore = Math.max(existing.riskScore, score);
              if (ent.aliases && ent.aliases.length > 0) {
                const combined = Array.from(
                  new Set([...(existing.alias ? existing.alias.split(", ") : []), ...ent.aliases])
                ).join(", ");
                existing.alias = combined;
              }
            } else {
              const entId = ent.id || `E-${1000 + entityMap.size}`;
              entityMap.set(key, {
                id: entId,
                name: ent.name,
                alias: ent.aliases && ent.aliases.length > 0 ? ent.aliases.join(", ") : undefined,
                type: mappedType,
                riskScore: score,
                status,
                lastSeen: today,
              });
            }
          });
        }

        // Count relationships
        if (ext.relationships && Array.isArray(ext.relationships)) {
          totalRelationships += ext.relationships.length;
        }

        // Aggregate timeline events
        if (ext.events && Array.isArray(ext.events)) {
          ext.events.forEach((ev, evIdx) => {
            timelineEvents.push({
              id: `T-${sIdx + 1}${String(evIdx + 2).padStart(2, "0")}`,
              timestamp: ev.timestamp || `${today} 12:00`,
              title: ev.title || `Occurrence from ${src.filename}`,
              description: ev.description || "",
              type: mapExtractedTimelineType(ev.type),
              relatedEntities: ev.entitiesInvolved || [],
            });
          });
        }

        // Aggregate evidence references
        if (ext.evidenceReferences && Array.isArray(ext.evidenceReferences)) {
          ext.evidenceReferences.forEach((ref, rIdx) => {
            evidenceItems.push({
              id: `EV-${sIdx + 1}${String(rIdx + 2).padStart(2, "0")}`,
              title: ref.pageOrSection ? `Citation: ${ref.pageOrSection}` : `Dossier Reference (${src.filename})`,
              type: "DOCUMENT",
              source: src.filename,
              dateAdded: today,
              linkedEntities: ref.entitiesReferenced || [],
              description: `"${ref.excerpt}" — ${ref.relevance || "Forensic extract citation."}`,
            });
          });
        }

        // Aggregate alerts
        if (ext.alerts && Array.isArray(ext.alerts)) {
          ext.alerts.forEach((alt, aIdx) => {
            caseAlerts.push({
              id: `ALT-${sIdx + 1}${String(aIdx + 1).padStart(2, "0")}`,
              title: alt.title,
              description: alt.description,
              severity: (alt.severity as AlertSeverity) || "WARNING",
              status: "NEW",
              timestamp: "Just now",
            });
          });
        }
      }
    });

    const uniqueEntities = Array.from(entityMap.values());

    // Build Networks
    const networks: CaseNetwork[] = [
      {
        id: `NET-${caseRow.id.replace(/[^0-9]/g, "") || "001"}`,
        name: `${caseRow.title} Core Ring`,
        nodes: uniqueEntities.length,
        edges: totalRelationships,
        riskLevel: caseRow.priority === "HIGH" ? "CRITICAL" : "HIGH",
      },
    ];

    // Build AI Messages
    const aiMessages = [
      {
        id: "M-001",
        role: "ai" as const,
        content: `**Case Initialized**: ${caseRow.title}\n\n${
          caseRow.ai_assessment?.finding || caseRow.summary || "Case topology compiled."
        }\n\nIndexed ${uniqueEntities.length} entities and ${evidenceItems.length} evidence references across ${
          sources.length
        } ingested source documents.`,
        timestamp: "Just now",
      },
    ];

    const caseDetail: CaseDetail = {
      id: caseRow.id,
      name: caseRow.title,
      status: caseRow.status,
      priority: caseRow.priority || "HIGH",
      description: caseRow.summary || "",
      brief: caseRow.summary || "",
      investigator: caseRow.investigator || "LEAD INVESTIGATOR",
      team: [caseRow.investigator || "LEAD INVESTIGATOR", "AI FORENSIC AGENT"],
      opened: caseRow.created_at ? caseRow.created_at.split("T")[0] : today,
      updated: caseRow.updated_at ? "Recently" : "Just now",
      jurisdiction: caseRow.jurisdiction || "NATIONAL",
      classification: caseRow.classification || "RESTRICTED // LEVEL-3",
      entityCount: uniqueEntities.length,
      relationshipCount: totalRelationships,
      evidenceCount: evidenceItems.length,
      alertCount: caseAlerts.length,
      aiAssessment: caseRow.ai_assessment || {
        finding: caseRow.summary || "Initial case topology indexed.",
        confidence: 90,
        category: "FORENSIC ASSESSMENT",
      },
      networks,
      entities: uniqueEntities,
      timeline: timelineEvents,
      evidence: evidenceItems,
      alerts: caseAlerts,
      aiMessages,
    };

    return { success: true, data: caseDetail };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteCaseRecordFromDb(
  caseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("cases")
      .delete()
      .eq("id", caseId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Supabase Entities CRUD & Extraction Synchronization ─────────────────────

export interface EntityRecord {
  id: string;
  name: string;
  alias?: string | null;
  type: EntityType;
  risk_score: number;
  status: EntityStatus;
  cases: string[];
  last_seen: string;
  attributes?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export async function createEntityInDb(params: {
  id?: string;
  name: string;
  alias?: string;
  type: EntityType;
  risk_score?: number;
  status?: EntityStatus;
  cases?: string[];
  last_seen?: string;
  attributes?: Record<string, any>;
}): Promise<{ success: boolean; data?: EntityRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const score = typeof params.risk_score === "number" ? params.risk_score : 70;
    const status: EntityStatus =
      params.status || (score >= 75 ? "FLAGGED" : score >= 40 ? "MONITORING" : "CLEARED");

    const payload = {
      id: params.id || `E-${Date.now().toString().slice(-4)}`,
      name: params.name.trim(),
      alias: params.alias || null,
      type: params.type,
      risk_score: score,
      status,
      cases: params.cases || [],
      last_seen: params.last_seen || today,
      attributes: params.attributes || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("entities")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("createEntityInDb error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateEntityInDb(
  id: string,
  updates: Partial<EntityRecord>
): Promise<{ success: boolean; data?: EntityRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("entities")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchEntitiesFromDb(options?: {
  type?: EntityType | "ALL";
  status?: EntityStatus | "ALL";
  search?: string;
  sortBy?: "riskScore" | "name" | "lastSeen";
  sortOrder?: "asc" | "desc";
}): Promise<{ success: boolean; entities: EntityRecord[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("entities").select("*");

    if (options?.type && options.type !== "ALL") {
      query = query.eq("type", options.type);
    }
    if (options?.status && options.status !== "ALL") {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return { success: true, entities: [] };
      }
      return { success: false, entities: [], error: error.message };
    }

    let entities: EntityRecord[] = data || [];

    if (options?.search) {
      const q = options.search.toLowerCase();
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.alias && e.alias.toLowerCase().includes(q))
      );
    }

    const sortBy = options?.sortBy || "riskScore";
    const sortOrder = options?.sortOrder || "desc";

    entities.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "riskScore") cmp = a.risk_score - b.risk_score;
      else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "lastSeen")
        cmp = new Date(a.last_seen).getTime() - new Date(b.last_seen).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return { success: true, entities };
  } catch (err) {
    return {
      success: false,
      entities: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchEntityByIdFromDb(
  id: string
): Promise<{ success: boolean; data?: EntityRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || `Entity '${id}' not found` };
    }
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncExtractedEntitiesToDb(
  caseId: string,
  extractedEntities: ExtractedEntity[]
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    if (!extractedEntities || !Array.isArray(extractedEntities) || extractedEntities.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const supabase = getSupabaseAdminClient();
    const today = new Date().toISOString().split("T")[0];
    let syncedCount = 0;

    // Fetch existing entities to check for duplicates by (lower(name), type)
    const { data: existingEntities } = await supabase.from("entities").select("*");
    const currentList: EntityRecord[] = existingEntities || [];

    for (const ent of extractedEntities) {
      if (!ent.name || !ent.name.trim()) continue;

      const cleanName = ent.name.trim();
      const mappedType = mapExtractedEntityType(ent.type);
      const score = typeof ent.riskScore === "number" ? ent.riskScore : 70;
      const status: EntityStatus = score >= 75 ? "FLAGGED" : score >= 40 ? "MONITORING" : "CLEARED";
      const aliases = ent.aliases && ent.aliases.length > 0 ? ent.aliases.join(", ") : undefined;

      // Find existing match by name & type
      const match = currentList.find(
        (e) => e.name.toLowerCase().trim() === cleanName.toLowerCase() && e.type === mappedType
      );

      if (match) {
        // Merge cases
        const updatedCases = Array.from(new Set([...(match.cases || []), caseId]));
        const updatedScore = Math.max(match.risk_score || 0, score);
        const updatedStatus: EntityStatus =
          updatedScore >= 75 ? "FLAGGED" : updatedScore >= 40 ? "MONITORING" : "CLEARED";

        let combinedAlias = match.alias;
        if (aliases) {
          const aliasSet = new Set([
            ...(match.alias ? match.alias.split(", ") : []),
            ...(ent.aliases || []),
          ]);
          combinedAlias = Array.from(aliasSet).join(", ");
        }

        await supabase
          .from("entities")
          .update({
            cases: updatedCases,
            risk_score: updatedScore,
            status: updatedStatus,
            alias: combinedAlias || null,
            last_seen: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.id);

        syncedCount++;
      } else {
        // Insert new entity row
        const newId = `E-${1000 + currentList.length + syncedCount + 1}`;
        const newRow = {
          id: newId,
          name: cleanName,
          alias: aliases || null,
          type: mappedType,
          risk_score: score,
          status,
          cases: [caseId],
          last_seen: today,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertErr } = await supabase.from("entities").insert(newRow);
        if (!insertErr) {
          currentList.push(newRow as EntityRecord);
          syncedCount++;
        } else {
          console.warn("Failed to insert entity in sync:", insertErr.message);
        }
      }
    }

    return { success: true, syncedCount };
  } catch (err) {
    console.error("syncExtractedEntitiesToDb error:", err);
    return {
      success: false,
      syncedCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Supabase Alerts CRUD & Extraction Synchronization ───────────────────────

export interface AlertRecord {
  id: string;
  case_id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category?: string | null;
  entity_id?: string | null;
  created_at: string;
  updated_at: string;
}

export async function createAlertInDb(params: {
  id?: string;
  case_id: string;
  title: string;
  description: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  category?: string;
  entity_id?: string;
}): Promise<{ success: boolean; data?: AlertRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const payload = {
      id: params.id || `ALT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
      case_id: params.case_id,
      title: params.title,
      description: params.description,
      severity: params.severity || "WARNING",
      status: params.status || "NEW",
      category: params.category || "INTELLIGENCE",
      entity_id: params.entity_id || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("alerts")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("createAlertInDb error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateAlertStatusInDb(
  id: string,
  status: AlertStatus
): Promise<{ success: boolean; data?: AlertRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("alerts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAlertsFromDb(options?: {
  severity?: AlertSeverity | "ALL";
  status?: AlertStatus | "ALL";
  caseId?: string;
}): Promise<{ success: boolean; alerts: AlertRecord[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("alerts").select("*");

    if (options?.severity && options.severity !== "ALL") {
      query = query.eq("severity", options.severity);
    }
    if (options?.status && options.status !== "ALL") {
      query = query.eq("status", options.status);
    }
    if (options?.caseId) {
      query = query.eq("case_id", options.caseId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return { success: true, alerts: [] };
      }
      return { success: false, alerts: [], error: error.message };
    }

    return { success: true, alerts: data || [] };
  } catch (err) {
    return {
      success: false,
      alerts: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAlertByIdFromDb(
  id: string
): Promise<{ success: boolean; data?: AlertRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || `Alert '${id}' not found` };
    }
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncExtractedAlertsToDb(
  caseId: string,
  extractedAlerts: ExtractedAlert[]
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    if (!extractedAlerts || !Array.isArray(extractedAlerts) || extractedAlerts.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    let syncedCount = 0;

    for (let idx = 0; idx < extractedAlerts.length; idx++) {
      const alt = extractedAlerts[idx];
      if (!alt.title || !alt.title.trim()) continue;

      const altId = `ALT-${Date.now().toString().slice(-4)}${idx}${Math.floor(Math.random() * 10)}`;
      const severity: AlertSeverity =
        alt.severity === "CRITICAL" || alt.severity === "WARNING" || alt.severity === "INFO"
          ? alt.severity
          : "WARNING";

      const newRow = {
        id: altId,
        case_id: caseId,
        title: alt.title.trim(),
        description: alt.description || "",
        severity,
        status: "NEW" as AlertStatus,
        category: alt.category || "INTELLIGENCE",
        entity_id: alt.entityId || null,
        created_at: now,
        updated_at: now,
      };

      const { error: insertErr } = await supabase.from("alerts").insert(newRow);
      if (!insertErr) {
        syncedCount++;
      } else {
        console.warn("Failed to insert alert in sync:", insertErr.message);
      }
    }

    return { success: true, syncedCount };
  } catch (err) {
    console.error("syncExtractedAlertsToDb error:", err);
    return {
      success: false,
      syncedCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatRelativeOrTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

export async function fetchOverviewTelemetryFromDb(): Promise<{
  success: boolean;
  data?: OverviewTelemetry;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch cases
    const { data: casesData } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch data_sources
    const { data: dataSourcesData } = await supabase
      .from("data_sources")
      .select("*")
      .order("uploaded_at", { ascending: false });

    // 3. Fetch alerts
    const { data: alertsData } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    // 4. Fetch entities
    const { data: entitiesData } = await supabase
      .from("entities")
      .select("*");

    const cases = (casesData || []) as any[];
    const allDataSources = (dataSourcesData || []) as DataSourceRecord[];
    const alerts = (alertsData || []) as AlertRecord[];
    const entitiesTable = (entitiesData || []) as EntityRecord[];

    // Group data_sources by case_id
    const caseSourcesMap = new Map<string, DataSourceRecord[]>();
    for (const src of allDataSources) {
      const cid = src.case_id || "CASE-UNASSIGNED";
      if (!caseSourcesMap.has(cid)) {
        caseSourcesMap.set(cid, []);
      }
      caseSourcesMap.get(cid)!.push(src);
    }

    // Set of known case IDs
    const knownCaseIds = new Set(cases.map((c) => c.id));

    // For any case_id in data_sources that isn't in cases table, synthesize a case entry
    for (const [cid, sources] of caseSourcesMap.entries()) {
      if (!knownCaseIds.has(cid)) {
        const firstSrc = sources[0];
        const ext = firstSrc.extracted_data as any;
        let localCase: any = null;
        try {
          const { dataStore } = require("@/lib/api/data-store");
          localCase = dataStore.getCaseById(cid);
        } catch {
          // ignore
        }
        const title = localCase?.name || ext?.caseTitle || (firstSrc.filename ? `Case ${cid} (${firstSrc.filename})` : `Investigation ${cid}`);
        const summary = localCase?.description || ext?.summary || `Intelligence dossier compiled from ${firstSrc.source_type} records.`;
        cases.push({
          id: cid,
          case_number: cid,
          title,
          summary,
          status: "ACTIVE",
          priority: localCase?.priority || (ext?.aiAssessment?.category?.includes("PRIMARY") ? "HIGH" : "HIGH"),
          investigator: localCase?.investigator || "LEAD INVESTIGATOR",
          created_at: localCase?.opened || firstSrc.uploaded_at || new Date().toISOString(),
          updated_at: localCase?.updated || firstSrc.updated_at || new Date().toISOString(),
        });
        knownCaseIds.add(cid);
      }
    }

    // Compute unique entities across all data_sources + entities table
    const entityMap = new Map<string, { id: string; name: string; type: string; riskScore: number }>();
    const recentEvents: ActivityLog[] = [];
    const synthesizedAlerts: GlobalAlert[] = [];

    // Process entities from table
    for (const ent of entitiesTable) {
      if (ent.name) {
        entityMap.set(ent.name.toLowerCase().trim(), {
          id: ent.id,
          name: ent.name,
          type: ent.type,
          riskScore: ent.risk_score,
        });
      }
    }

    // Process cases & data_sources
    const activeCaseSummaries: CaseSummary[] = [];

    for (const c of cases) {
      const sources = caseSourcesMap.get(c.id) || [];
      const caseEntitySet = new Set<string>();

      for (const src of sources) {
        const ext = src.extracted_data as IntelligenceExtractionResult | undefined;

        // Ingestion activity item
        if (src.uploaded_at) {
          const timeStr = formatRelativeOrTime(src.uploaded_at);
          recentEvents.push({
            id: `ACT-${src.id}`,
            time: timeStr,
            label: `${c.id} // ${src.source_type} ingested (${src.filename}) · ${src.status}`,
            severityColor: src.status === "FAILED" ? "red" : src.status === "IMPORTED" ? "emerald" : "cyan",
          });
        }

        if (ext) {
          // Entities from extraction
          if (ext.entities && Array.isArray(ext.entities)) {
            for (const ent of ext.entities) {
              if (ent.name) {
                const key = ent.name.toLowerCase().trim();
                caseEntitySet.add(key);
                if (!entityMap.has(key)) {
                  entityMap.set(key, {
                    id: ent.id,
                    name: ent.name,
                    type: ent.type,
                    riskScore: ent.riskScore || 70,
                  });
                }
              }
            }
          }

          // Chronological events from extraction
          if (ext.events && Array.isArray(ext.events)) {
            for (const ev of ext.events) {
              const evTime = ev.timestamp ? ev.timestamp.slice(-5) : "12:00";
              recentEvents.push({
                id: `ACT-EV-${ev.id || Math.random().toString(36).substring(2, 7)}`,
                time: evTime,
                label: `${c.id} // ${ev.type || "INCIDENT"}: ${ev.title} ${ev.location ? `(${ev.location})` : ""}`,
                severityColor: (ev.type?.toUpperCase().includes("ARREST") || ev.type?.toUpperCase().includes("ALERT"))
                  ? "red"
                  : (ev.type?.toUpperCase().includes("CALL") || ev.type?.toUpperCase().includes("COMM"))
                  ? "cyan"
                  : "amber",
              });
            }
          }

          // Case-level alerts
          if (ext.alerts && Array.isArray(ext.alerts)) {
            for (const alt of ext.alerts) {
              synthesizedAlerts.push({
                id: `ALT-${c.id}-${synthesizedAlerts.length + 1}`,
                title: alt.title,
                description: alt.description,
                severity: (alt.severity as AlertSeverity) || "WARNING",
                status: "NEW",
                caseId: c.id,
                timestamp: "Just now",
              });
            }
          }
        }
      }

      if (c.status === "ACTIVE") {
        activeCaseSummaries.push({
          id: c.id,
          name: c.title || c.name || `Case ${c.id}`,
          status: c.status,
          priority: c.priority || "HIGH",
          entities: caseEntitySet.size,
          networks: caseEntitySet.size > 0 ? 1 : 0,
          investigator: c.investigator || "LEAD INVESTIGATOR",
          opened: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          updated: c.updated_at ? "Recently" : "Just now",
          description: c.summary || "",
        });
      }
    }

    // Process alerts table
    const mappedGlobalAlerts: GlobalAlert[] = alerts.map((alt) => ({
      id: alt.id,
      title: alt.title,
      description: alt.description,
      severity: alt.severity,
      status: alt.status,
      caseId: alt.case_id,
      timestamp: formatRelativeOrTime(alt.created_at),
    }));

    // Merge alerts: priority to DB alerts, enriched by synthesized alerts
    const allAlerts = [...mappedGlobalAlerts, ...synthesizedAlerts];

    // Sort alerts: CRITICAL first, then WARNING, then INFO
    const severityWeight: Record<string, number> = { CRITICAL: 3, WARNING: 2, INFO: 1 };
    allAlerts.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

    // Fallback if no recent events yet
    if (recentEvents.length === 0) {
      recentEvents.push({
        id: "ACT-INIT",
        time: "09:00",
        label: "SYSTEM // Intelligence telemetry engine active · Monitoring channels",
        severityColor: "emerald",
      });
    }

    const casesWithEntities = cases.filter((c) =>
      (caseSourcesMap.get(c.id) || []).some((s: any) => s.extracted_data?.entities?.length > 0)
    );
    const networkCount = Math.max(casesWithEntities.length, cases.length > 0 ? 1 : 0);

    const activeCasesCount = activeCaseSummaries.length;
    const totalEntitiesCount = entityMap.size;
    const unreadAlertsCount = allAlerts.filter((a) => a.status === "NEW").length;
    const criticalAlertsCount = allAlerts.filter((a) => a.severity === "CRITICAL").length;

    const telemetry: OverviewTelemetry = {
      stats: {
        activeCases: {
          value: activeCasesCount,
          delta: `${activeCasesCount} active / ${cases.length} total`,
        },
        totalEntities: {
          value: totalEntitiesCount,
          delta: `${totalEntitiesCount} identified across cases`,
        },
        networks: {
          value: networkCount,
          delta: `${networkCount} topology ring${networkCount === 1 ? "" : "s"} mapped`,
        },
        alerts: {
          value: unreadAlertsCount,
          delta: `${criticalAlertsCount} critical / ${allAlerts.length} total`,
        },
      },
      activeInvestigations: activeCaseSummaries,
      priorityAlerts: allAlerts.slice(0, 5),
      recentActivity: recentEvents.slice(0, 8),
    };

    return { success: true, data: telemetry };
  } catch (err) {
    console.error("fetchOverviewTelemetryFromDb error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}


