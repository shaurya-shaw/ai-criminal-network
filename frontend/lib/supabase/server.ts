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

// ─── File Upload Helper ───────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
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

    // Get signed URL for access (valid for 24 hours)
    let signedUrl = "";
    try {
      const { data: signedData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 86400);
      signedUrl = signedData?.signedUrl || "";
    } catch {
      // Signed URL failure is non-fatal
    }

    return {
      success: true,
      path: data.path,
      url: signedUrl,
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

// ─── File Listing Helper ──────────────────────────────────────────────────────

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

    // 1. List case folders under 'cases/'
    const { data: caseFolders, error: caseFoldersError } = await supabase.storage
      .from(bucketName)
      .list("cases", { limit: 100 });

    if (caseFoldersError) {
      // If bucket is not found or empty
      if (caseFoldersError.message.includes("Bucket not found")) {
        return { success: true, files: [], totalBytes: 0 };
      }
      return { success: false, files: [], totalBytes: 0, error: caseFoldersError.message };
    }

    if (!caseFolders || caseFolders.length === 0) {
      return { success: true, files: [], totalBytes: 0 };
    }

    // 2. Iterate through each case folder
    for (const caseFolder of caseFolders) {
      const caseId = caseFolder.name;
      // Skip hidden files or system files
      if (caseId.startsWith(".")) continue;

      const { data: sourceFolders } = await supabase.storage
        .from(bucketName)
        .list(`cases/${caseId}`, { limit: 50 });

      if (!sourceFolders || sourceFolders.length === 0) continue;

      // 3. Iterate through each source type folder (e.g. FIR, CDRS)
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

        // 4. Process each file
        for (const fileObj of fileObjects) {
          if (fileObj.name.startsWith(".")) continue;

          const rawName = fileObj.name;
          const storagePath = `cases/${caseId}/${sourceType}/${rawName}`;
          const size = fileObj.metadata?.size || 0;
          totalBytes += size;

          // Strip leading timestamp e.g. "1788066625009-fir-report-402.pdf" -> "fir-report-402.pdf"
          const cleanName = rawName.replace(/^\d+-/, "");

          // Create signed preview URL & signed download URL
          let url = "";
          let downloadUrl = "";

          try {
            const { data: signedData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 86400); // 24 hours
            url = signedData?.signedUrl || "";

            const { data: downloadSignedData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 86400, { download: cleanName });
            downloadUrl = downloadSignedData?.signedUrl || url;
          } catch {
            // Non-fatal if signed URL fails
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

    // Sort files by uploadedAt desc
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

