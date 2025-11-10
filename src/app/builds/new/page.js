"use client";

import BuildEditor from "@/app/components/BuildEditor";

export const metadata = {
    title: "New Team Build",
    description: "Create a new team build"
};

export default function NewBuild() {
  return <BuildEditor mode="create" />;
}
