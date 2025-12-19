"use client";

import BuildEditor from "@/app/builds/BuildEditor";
import React from "react";

export default function EditBuildPage({params}) {
    const { id } = React.use(params);
    return <BuildEditor mode="edit" buildId={id} />;
}
