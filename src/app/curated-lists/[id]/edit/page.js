"use client";

import React from "react";
import CuratedListEditor from "../../CuratedListEditor";

export default function EditCuratedListPage({params}) {
    const { id } = React.use(params);
    return <CuratedListEditor mode="edit" listId={id} />;
}
