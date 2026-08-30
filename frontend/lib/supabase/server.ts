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

import { IntelligenceExtractionResult } from "@/lib/ai/types";
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
