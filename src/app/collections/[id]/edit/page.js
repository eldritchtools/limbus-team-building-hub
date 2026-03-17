"use client";

import React from "react";
import CuratedListEditor from "../../CollectionEditor";

export default function EditCuratedListPage({params}) {
    const { id } = React.use(params);
    return <CuratedListEditor mode="edit" listId={id} />;
}
