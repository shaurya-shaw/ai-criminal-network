import { NextRequest, NextResponse } from "next/server";
import { processDataSourceDocument, fetchDataSourceById, updateCaseInDb, syncExtractedEntitiesToDb, syncExtractedAlertsToDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import { syncDataSourceGraph } from "@/lib/neo4j/case-graph";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    const result = await processDataSourceDocument(id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to process data source document with AI",
          details: result.error,
        },
        { status: 500 }
      );
    }

    // The JSONB extraction remains the source record. Project it to Neo4j now
    // so the graph is ready when an investigator opens the network view.
    let graphSync: { success: boolean; diagnostics?: unknown; error?: string };
    try {
      graphSync = { success: true, diagnostics: await syncDataSourceGraph(id) };
    } catch (graphError) {
      // Do not discard a successfully persisted Gemini extraction if Neo4j is
      // temporarily unavailable. The network endpoint will retry this backfill.
      graphSync = {
        success: false,
        error: graphError instanceof Error ? graphError.message : String(graphError),
      };
      console.warn("Neo4j graph synchronization note:", graphSync.error);
    }

    // Synchronize extracted intelligence into case workspace
    try {
      const sourceRes = await fetchDataSourceById(id);
      if (sourceRes.success && sourceRes.source && result.data) {
        const src = sourceRes.source;
        const sourceInfo = {
          id: src.id,
          filename: src.filename,
          storagePath: src.storage_path,
          sourceType: src.source_type,
          fileSize: src.file_size || undefined,
        };
        const existingCase = dataStore.getCaseById(src.case_id);
        let updatedTargetCase = undefined;
        if (existingCase) {
          updatedTargetCase = dataStore.enrichCaseWithExtraction(src.case_id, result.data, sourceInfo);
        } else {
          updatedTargetCase = dataStore.createCaseFromExtraction({
            id: src.case_id,
            name: undefined,
            priority: "HIGH",
            investigator: src.uploaded_by || "LEAD INVESTIGATOR",
            jurisdiction: "NATIONAL",
            extraction: result.data,
            sourceInfo,
          });
        }

        if (updatedTargetCase) {
          try {
            await updateCaseInDb(src.case_id, {
              title: updatedTargetCase.name,
              summary: updatedTargetCase.brief || updatedTargetCase.description,
              ai_assessment: updatedTargetCase.aiAssessment,
              priority: updatedTargetCase.priority,
              jurisdiction: updatedTargetCase.jurisdiction,
              classification: updatedTargetCase.classification,
              investigator: updatedTargetCase.investigator,
              status: updatedTargetCase.status,
            });

            if (result.data.entities && Array.isArray(result.data.entities)) {
              await syncExtractedEntitiesToDb(src.case_id, result.data.entities);
            }

            if (result.data.alerts && Array.isArray(result.data.alerts)) {
              await syncExtractedAlertsToDb(src.case_id, result.data.alerts);
            }
          } catch (dbCaseErr) {
            console.warn("Supabase updateCaseInDb note in process route:", dbCaseErr);
          }

        }

      }
    } catch (storeErr) {
      console.warn("Could not sync case in data store during process:", storeErr);
    }


    return NextResponse.json(
      {
        success: true,
        message: "Document analyzed and intelligence extracted successfully.",
        extraction: result.data,
        graphSync,
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error processing document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
