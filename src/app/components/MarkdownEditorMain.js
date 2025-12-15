'use client';
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorView } from '@codemirror/view';
import { FaBold, FaItalic, FaHeading, FaQuoteRight, FaLink, FaImage, FaListUl, FaListOl, FaQuestionCircle } from 'react-icons/fa';

export default function MarkdownEditorMain({ value = '', onChange, placeholder, short = false }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getText());
        },
        editorProps: {
            attributes: {
                style: `min-height: ${short ? 150 : 300}px; font-family: sans-serif; font-size: 16px;`,
            },
        },
    });

    useEffect(() => {
        if (!editor) return;

        const editorTheme = EditorView.theme({
            '&': {
                height: 'auto',
                backgroundColor: '#2a2a2a',
                color: '#ddd'
            },
            '.cm-content': {
                caretColor: '#ddd',
            },
            '.cm-scroller': { overflow: 'hidden' },
            '.cm-placeholder': { color: '#888888' },
        });

        editor.view.dispatch({
            effects: EditorView.reconfigure.of([editorTheme]),
        });
    }, [editor]);

    // Toolbar button handlers
    const toggleBold = () => editor?.chain().focus().toggleBold().run();
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
    const toggleHeading = (level) => editor?.chain().focus().toggleHeading({ level }).run();
    const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
    const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
    const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
    const insertLink = () => {
        const url = prompt('Enter URL') || '';
        if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };
    const insertImage = () => {
        const url = prompt('Enter image URL') || '';
        if (url) editor?.chain().focus().setImage({ src: url }).run();
    };
    const insertInlineLaTeX = () => {
        const selection = editor?.state.selection;
        if (!editor || !selection) return;

        const selectedText = editor.state.sliceDoc(selection.from, selection.to);
        const latexContent = `$${selectedText}$`;

        editor.chain().focus().deleteRange({ from: selection.from, to: selection.to }).insertContent(latexContent).run();
    };

    const insertBlockLaTeX = () => {
        const selection = editor?.state.selection;
        if (!editor || !selection) return;

        const selectedText = editor.state.sliceDoc(selection.from, selection.to) || '';
        const latexBlock = `$$\n${selectedText}\n$$`;

        editor.chain().focus().deleteRange({ from: selection.from, to: selection.to }).insertContent(latexBlock).run();
    };
    const guideClick = () => window.open('https://www.markdownguide.org/basic-syntax/', '_blank');

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: 4 }}>
            <div style={{ borderBottom: '1px solid #ccc', padding: '4px 8px', display: 'flex', gap: 4 }}>
                <button onClick={toggleBold}><FaBold /></button>
                <button onClick={toggleItalic}><FaItalic /></button>
                <button onClick={() => toggleHeading(1)}><FaHeading /></button>
                <button onClick={toggleBlockquote}><FaQuoteRight /></button>
                <button onClick={toggleBulletList}><FaListUl /></button>
                <button onClick={toggleOrderedList}><FaListOl /></button>
                <button onClick={insertLink}><FaLink /></button>
                <button onClick={insertImage}><FaImage /></button>
                <button onClick={insertInlineLaTeX}>$</button>
                <button onClick={insertBlockLaTeX}>$$</button>
                <button onClick={guideClick}><FaQuestionCircle /></button>

                {/* <button type="button" title="bold" onClick={toggleBold}><b>B</b></button>
                <button type="button" title="italic" onClick={toggleItalic}><i>I</i></button>
                <button type="button" title="heading 1" onClick={() => toggleHeading(1)}>H1</button>
                <button type="button" title="heading 2" onClick={() => toggleHeading(2)}>H2</button>
                <button type="button" title="quote" onClick={toggleBlockquote}>&quot;</button>
                <button type="button" title="unordered list" onClick={toggleBulletList}>• List</button>
                <button type="button" title="ordered list" onClick={toggleOrderedList}>1. List</button>
                <button type="button" title="link" onClick={insertLink}>Link</button>
                <button type="button" title="image" onClick={insertImage}>Image</button>
                <button type="button" title="inline LaTeX" onClick={insertInlineLaTeX}>$</button>
                <button type="button" title="block LaTeX" onClick={insertBlockLaTeX}>$$</button>
                <button type="button" title="markdown guide" onClick={guideClick}>Guide</button> */}
            </div>

            <EditorContent editor={editor} style={{ padding: 8, minHeight: short ? 150 : 300 }} />
        </div>
    );
}
