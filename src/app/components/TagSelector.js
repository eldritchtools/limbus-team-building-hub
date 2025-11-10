"use client";

import { useMemo } from "react";
import debounce from "lodash.debounce";
import { fetchTags, handleCreateTag } from "../database/tags";
import { selectStyle, selectStyleWide } from "../styles";

import dynamic from "next/dynamic";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
const AsyncCreatableSelect = dynamic(() => import("react-select/async-creatable"), { ssr: false });

export function tagToTagSelectorOption(tag) {
    return { value: tag, label: tag };
}

async function loadOptions(inputValue) {
    if (!inputValue?.trim()) return [];

    const tags = await fetchTags(inputValue);
    return tags.map(t => tagToTagSelectorOption(t));
}

const debouncedLoadOptions = debounce((inputValue, resolve) => loadOptions(inputValue).then(resolve), 300);

export default function TagSelector({ selected, onChange, creatable = false, wide = false }) {
    const loadOptionsFinal = (inputValue) => new Promise((resolve) => debouncedLoadOptions(inputValue, resolve));

    const SelectComponent = creatable ? AsyncCreatableSelect : AsyncSelect;

    return (
        <div style={{ width: "40rem" }}>
            <SelectComponent
                isMulti
                cacheOptions={false}
                defaultOptions={[]}
                loadOptions={loadOptionsFinal}
                value={selected}
                onChange={onChange}
                placeholder={creatable ? "Type to search or create tags..." : "Type to search tags..."}
                onCreateOption={
                    creatable
                        ? async (name) => {
                            const newTag = await handleCreateTag(name);
                            if (newTag) onChange([...selected, tagToTagSelectorOption(newTag)]);
                        }
                        : undefined
                }
                styles={wide ? selectStyleWide : selectStyle}
                noOptionsMessage={() => "No matching tags"}
            />
        </div>
    );
}
