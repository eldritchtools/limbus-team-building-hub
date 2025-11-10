"use client";

import BuildEditor from "@/app/components/BuildEditor";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

export default function EditBuildPage() {
    const searchParams = useSearchParams();
    const id = useMemo(() => searchParams.get("id"), [searchParams]);
    const router = useRouter();

    if (!id) router.back();
    else
        return <BuildEditor mode="edit" buildId={searchParams["id"]} />;
}
