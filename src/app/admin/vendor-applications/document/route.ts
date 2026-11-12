import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

type DocumentType = "identity" | "cac";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const userId = url.searchParams.get("user_id");
  const documentType = url.searchParams.get(
    "type",
  ) as DocumentType | null;

  if (!userId) {
    return NextResponse.json(
      {
        error: "Missing vendor user ID.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    documentType !== "identity" &&
    documentType !== "cac"
  ) {
    return NextResponse.json(
      {
        error: "Invalid document type.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await requireAdmin();

    const admin = adminClient();

    const { data: application, error: applicationError } =
      await admin
        .from("fernami_vendor_applications")
        .select(
          "user_id, id_document_url, cac_document_url",
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (applicationError) {
      console.error(
        "Application lookup error:",
        applicationError.message,
      );

      return NextResponse.json(
        {
          error: "Could not load vendor application.",
        },
        {
          status: 500,
        },
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          error: "Vendor application not found.",
        },
        {
          status: 404,
        },
      );
    }

    const storagePath =
      documentType === "identity"
        ? application.id_document_url
        : application.cac_document_url;

    if (!storagePath) {
      return NextResponse.json(
        {
          error: "This document has not been uploaded.",
        },
        {
          status: 404,
        },
      );
    }

    const { data: signedUrlData, error: signedUrlError } =
      await admin.storage
        .from("vendor-documents")
        .createSignedUrl(storagePath, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        "Signed URL error:",
        signedUrlError?.message,
      );

      return NextResponse.json(
        {
          error: "Could not create a secure document link.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Admin document access error:", error);

    return NextResponse.json(
      {
        error: "You are not authorized to view this document.",
      },
      {
        status: 403,
      },
    );
  }
}