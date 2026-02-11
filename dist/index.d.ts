import { RawDraftContentState, RawDraftInlineStyleRange, RawDraftEntityRange, RawDraftContentBlock, RawDraftEntity } from 'draft-js';

type DraftJSContent = RawDraftContentState;
/**
 * Check if a range is an inline style range.
 * @param range The range to check.
 * @returns `true` if the range is an inline style range, `false` otherwise.
 */
declare function isInlineStyleRange(range: RawDraftInlineStyleRange | RawDraftEntityRange): range is RawDraftInlineStyleRange;
/**
 * Check if a range is an entity range.
 * @param range The range to check.
 * @returns `true` if the range is an entity range, `false` otherwise.
 */
declare function isEntityRange(range: RawDraftInlineStyleRange | RawDraftEntityRange): range is RawDraftEntityRange;
/**
 * Check if a node is a text node.
 * @param node The node to check.
 * @returns `true` if the node is a text node, `false` otherwise.
 */
declare function isDraftJSContent(node: unknown): node is DraftJSContent;

interface MarkMapping {
    bold: MarkType<"bold">;
    code: MarkType<"code">;
    italic: MarkType<"italic">;
    strike: MarkType<"strike">;
    underline: MarkType<"underline">;
    subscript: MarkType<"subscript">;
    superscript: MarkType<"superscript">;
    highlight: MarkType<"highlight", {
        color: string;
    }>;
    link: MarkType<"link", {
        href: string;
        target: string;
    }>;
    textStyle: MarkType<"textStyle", {
        fontFamily?: string;
        color?: string;
    }>;
}
interface NodeMapping {
    /**
     * Doc is special, it's the root of the document
     */
    doc: NodeType<"doc", Record<string, any>, MarkType, NodeType[]>;
    /**
     * Text is special, it's the leaf node of the document
     */
    text: NodeType<"text", Record<string, any>, MarkType, never>;
    blockquote: NodeType<"blockquote">;
    bulletList: NodeType<"bulletList", Record<string, any>, MarkType, NodeMapping["listItem"][]>;
    codeBlock: NodeType<"codeBlock">;
    hardBreak: NodeType<"hardBreak">;
    heading: NodeType<"heading", {
        level: number;
    }>;
    horizontalRule: NodeType<"horizontalRule">;
    image: NodeType<"image", {
        src: string;
        alt?: string;
    }>;
    listItem: NodeType<"listItem", Record<string, any>, MarkType, (NodeType<"bulletList"> | NodeType<"orderedList"> | NodeType<"paragraph">)[]>;
    orderedList: NodeType<"orderedList", {
        type?: "1" | "a" | "A" | "i" | "I";
        start?: number;
    }, MarkType, NodeMapping["listItem"][]>;
    paragraph: NodeType<"paragraph">;
    tableCell: NodeType<"tableCell", {
        colwidth?: number[];
        colspan?: number;
        rowspan?: number;
    }, MarkType, NodeType[]>;
    tableHeader: NodeType<"tableCell", {
        colwidth?: number[];
        colspan?: number;
        rowspan?: number;
    }, MarkType, NodeType[]>;
    tableRow: NodeType<"tableRow", Record<string, any>, MarkType, NodeMapping["tableCell"][]>;
    table: NodeType<"table", Record<string, any>, MarkType, NodeMapping["tableRow"][]>;
    taskItem: NodeType<"taskItem", {
        checked?: boolean;
    }, MarkType, (NodeType<"taskList"> | NodeType<"paragraph">)[]>;
    taskList: NodeType<"taskList", Record<string, any>, MarkType, NodeMapping["taskItem"][]>;
    pageBreak: NodeType<"pageBreak">;
}
type MarkType<Type extends string = string, Attributes extends Record<string, any> = Record<string, any>> = {
    type: Type;
    attrs?: Attributes & Record<string, any>;
};
type NodeType<TNodeType extends string = string, TNodeAttributes extends Record<string, any> = Record<string, any>, TMarkType extends MarkType = MarkType, TContentType extends NodeType[] = any> = {
    type: TNodeType;
    attrs?: TNodeAttributes & Record<string, any>;
    content?: TContentType;
    marks?: TMarkType[];
};
type DocumentType<TNodeAttributes extends Record<string, any> = Record<string, any>, TContentType extends NodeType[] = NodeType[]> = NodeType<"doc", TNodeAttributes, never, TContentType>;
type TextType<TMarkType extends MarkType = MarkType> = {
    type: "text";
    text: string;
    marks?: TMarkType[];
};
/**
 * Add a child node to a parent node.
 * @returns The parent node with the child node added.
 */
declare function addChild<TNodeType extends keyof NodeMapping>(node: NodeMapping[TNodeType], child: NodeMapping[TNodeType]["content"][number][] | NodeMapping[TNodeType]["content"][number] | null): NodeMapping[TNodeType];
/**
 * Add a mark to a node.
 * @returns The node with the mark added.
 */
declare function addMark<TNodeType extends keyof NodeMapping>(node: NodeMapping[TNodeType], mark: NonNullable<NodeMapping[TNodeType]["marks"]> | NonNullable<NodeMapping[TNodeType]["marks"]>[number] | null): NodeMapping[TNodeType];
/**
 * Create a ProseMirror node.
 * @param type The type of the node.
 * @param options Additional options for the node.
 */
declare function createNode<TNodeType extends keyof NodeMapping>(type: TNodeType, options?: Partial<Omit<NodeMapping[TNodeType], "type">>): NodeMapping[TNodeType];
/**
 * Create a ProseMirror mark.
 * @param type The type of the mark.
 * @param options Additional options for the mark.
 */
declare function createMark<TMarkType extends keyof MarkMapping>(type: TMarkType, options?: Partial<Omit<MarkMapping[TMarkType], "type">>): MarkMapping[TMarkType];
/**
 * Create a ProseMirror document.
 * @returns The document node.
 */
declare function createDocument(): DocumentType;
/**
 * Create a ProseMirror text node.
 * @param text The text content of the node.
 * @param marks The marks to apply to the text node.
 * @returns The text node.
 */
declare function createText(text: string, marks?: MarkType[]): TextType | null;
/**
 * Check if a node is a document node.
 * @param node The node to check.
 * @returns `true` if the node is a document node, `false` otherwise.
 */
declare function isDocument(node: unknown): node is DocumentType;
/**
 * Check if a node is a text node.
 * @param node The node to check.
 * @returns `true` if the node is a text node, `false` otherwise.
 */
declare function isText(node: unknown): node is TextType;
/**
 * Check if a node is a node.
 * @param node The node to check.
 * @returns `true` if the node is a node, `false` otherwise.
 */
declare function isNode(node: unknown): node is NodeType;
/**
 * Check if a node is a list node.
 */
declare function isListNode(node: NodeType | null | undefined): node is NodeMapping["bulletList"] | NodeMapping["orderedList"] | NodeMapping["taskList"];
/**
 * Adds a child to a list node, keeping the list structure intact.
 */
declare function addChildToList<TNodeType extends keyof NodeMapping>(
/**
 * The list to add the child to
 */
parent: NodeMapping[TNodeType], 
/**
 * The child to add to the list
 */
child: NodeType, 
/**
 * If true, append the child to the last list item in the list, if it exists
 * If false, add the child as a new list item
 * @default false
 */
append?: boolean): void;

type DraftConverterOptions = {
    mapBlockToNode: MapBlockToNodeFn;
    mapInlineStyleToMark: MapInlineStyleToMarkFn;
    mapEntityToMark: MapEntityToMarkFn;
    mapEntityToNode: MapEntityToNodeFn;
};
declare class DraftConverter {
    /**
     * Any unmatched blocks, entities, or inline styles that were not converted.
     */
    unmatched: {
        blocks: RawDraftContentBlock[];
        entities: {
            [key: string]: RawDraftEntity;
        };
        inlineStyles: RawDraftInlineStyleRange[];
    };
    options: DraftConverterOptions;
    constructor(options?: Partial<DraftConverterOptions>);
    createNode: typeof createNode;
    addChild: typeof addChild;
    createText: typeof createText;
    addMark: typeof addMark;
    mapRangeToMark({ range, entityMap, doc, block, }: {
        range: RawDraftInlineStyleRange | RawDraftEntityRange;
        entityMap: RawDraftContentState["entityMap"];
        doc: DocumentType;
        block: RawDraftContentBlock;
    }): MarkType | null;
    mapBlockToNode: MapBlockToNodeFn;
    mapEntityToNode: MapEntityToNodeFn;
    /**
     * This function splits a text into Nodes based on the entity ranges and inline style ranges.
     * Applying them as marks to the text. Which may overlap in their ranges.
     */
    splitTextByEntityRangesAndInlineStyleRanges(options: {
        /**
         * The Draft.js block to render.
         */
        block: RawDraftContentBlock;
        /**
         * The entity map of the Draft.js content.
         */
        entityMap: RawDraftContentState["entityMap"];
        /**
         * The current document tree
         */
        doc: DocumentType;
    }): TextType[];
    convert(draft: RawDraftContentState): DocumentType<Record<string, any>, NodeType<string, Record<string, any>, MarkType<string, Record<string, any>>, any>[]>;
}

/**
 * A function that maps a Draft.js block to a ProseMirror node.
 * @returns null if the block was not mapped, undefined if it was mapped
 */
type MapBlockToNodeFn = (context: {
    /**
     * The draft converter instance.
     */
    converter: DraftConverter;
    /**
     * The entity map of the Draft.js content.
     */
    entityMap: RawDraftContentState["entityMap"];
    /**
     * The current document tree
     */
    doc: DocumentType;
    /**
     * The current block to convert.
     */
    getCurrentBlock: () => RawDraftContentBlock;
    /**
     * The current block to convert.
     */
    block: RawDraftContentBlock;
    /**
     * The index of the current block.
     */
    index: number;
    /**
     * Sets the index of the current block.
     */
    setIndex: (index: number) => void;
    /**
     * All blocks in the content being converted.
     */
    allBlocks: RawDraftContentBlock[];
    /**
     * Peeks at the next block in the content. Without iterating.
     * @returns The next block or null if there is no next block.
     */
    peek: () => RawDraftContentBlock | null;
    /**
     * Peeks at the previous block in the content. Without iterating.
     * @returns The previous block or null if there is no previous block.
     */
    peekPrev: () => RawDraftContentBlock | null;
    /**
     * Gets the next block in the content. Iterating forward.
     * @returns The next block or null if there is no next block.
     */
    next: () => RawDraftContentBlock | null;
    /**
     * Gets the previous block in the content. Iterating backward.
     * @returns The previous block or null if there is no previous block.
     */
    prev: () => RawDraftContentBlock | null;
}) => NodeType | null | void | undefined;
/**
 * A function that maps a Draft.js inline style to a ProseMirror mark.
 */
type MapInlineStyleToMarkFn = (context: {
    /**
     * The range of the inline style in the content.
     */
    range: RawDraftInlineStyleRange;
    /**
     * The draft converter instance.
     */
    converter: DraftConverter;
    /**
     * The current document tree
     */
    doc: DocumentType;
    /**
     * The current block being converted.
     */
    block: RawDraftContentBlock;
}) => MarkType | null | void | undefined;
/**
 * A function that maps a Draft.js entity to a ProseMirror mark.
 */
type MapEntityToMarkFn = (context: {
    /**
     * The range of the entity in the content.
     */
    range: RawDraftEntityRange;
    /**
     * The entity map of the Draft.js content.
     */
    entityMap: RawDraftContentState["entityMap"];
    /**
     * The draft converter instance.
     */
    converter: DraftConverter;
    /**
     * The current document tree
     */
    doc: DocumentType;
    /**
     * The current block being converted.
     */
    block: RawDraftContentBlock;
}) => MarkType | null | void | undefined;
/**
 * A function that maps a Draft.js entity to a ProseMirror node.
 */
type MapEntityToNodeFn = (context: {
    /**
     * The range of the entity in the content.
     */
    range: RawDraftEntityRange;
    /**
     * The entity map of the Draft.js content.
     */
    entityMap: RawDraftContentState["entityMap"];
    /**
     * The draft converter instance.
     */
    converter: DraftConverter;
    /**
     * The current document tree
     */
    doc: DocumentType;
    /**
     * The current block being converted.
     */
    block: RawDraftContentBlock;
}) => NodeType | null | void | undefined;

declare const blockToNodeMapping: Record<string, MapBlockToNodeFn>;
/**
 * Maps a Draft.js block to a ProseMirror node.
 */
declare const mapBlockToNode: MapBlockToNodeFn;

declare const entityToMarkMapping: Record<string, (context: {
    entity: RawDraftEntity;
    converter: DraftConverter;
}) => MarkType | null>;
declare const mapEntityToMark: MapEntityToMarkFn;

declare const entityToNodeMapping: Record<string, (context: {
    entity: RawDraftEntity;
    converter: DraftConverter;
}) => NodeType | null>;
declare const mapEntityToNode: MapEntityToNodeFn;

declare const inlineStyleToMarkMapping: Record<string, MarkType>;
declare const mapInlineStyleToMark: MapInlineStyleToMarkFn;

export { type DocumentType, DraftConverter, type DraftConverterOptions, type DraftJSContent, type MapBlockToNodeFn, type MapEntityToMarkFn, type MapEntityToNodeFn, type MapInlineStyleToMarkFn, type MarkMapping, type MarkType, type NodeMapping, type NodeType, type TextType, addChild, addChildToList, addMark, blockToNodeMapping, createDocument, createMark, createNode, createText, entityToMarkMapping, entityToNodeMapping, inlineStyleToMarkMapping, isDocument, isDraftJSContent, isEntityRange, isInlineStyleRange, isListNode, isNode, isText, mapBlockToNode, mapEntityToMark, mapEntityToNode, mapInlineStyleToMark };
