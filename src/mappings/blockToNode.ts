import type { RawDraftContentBlock } from 'draft-js';
import { addChild, createNode, createText, isListNode } from "../utils";
import type { MapBlockToNodeFn } from "../types";


const mapToParagraphNode: MapBlockToNodeFn = function ({ doc, block, entityMap, converter }) {
  const paragraph = createNode("paragraph");
  if (block.inlineStyleRanges.length === 0) {
    if (block.entityRanges.length === 0) {
      // Plain text, fast path
      return addChild(paragraph, createText(block.text));
    }
  }

  return addChild(
      paragraph,
      converter.splitTextByEntityRangesAndInlineStyleRanges({
        doc,
        block,
        entityMap,
      })
  );
};

type ListNodeNames =
    { listNodeType: "taskList", listItemNodeType: "taskItem" } |
    { listNodeType: "bulletList" | "orderedList", listItemNodeType: "listItem" };

const getListNodeType = (blockType: RawDraftContentBlock["type"]): ListNodeNames => {
  switch (blockType) {
    case "checkable-list-item":
      return {
        listNodeType: "taskList",
        listItemNodeType: "taskItem",
      }
    case "unordered-list-item":
      return {
        listNodeType: "bulletList",
        listItemNodeType: "listItem",
      }
    default:
      return {
        listNodeType: "orderedList",
        listItemNodeType: "listItem",
      }
  }
}

/**
 * Lists are represented as a tree structure in ProseMirror.
 * Whereas in Draft.js they are represented as a flat list.
 * So, we need to build the tree structure for the list.
 * This is done by mutating the document in the right place,
 * block by block.
 */
const addListItemBlock: MapBlockToNodeFn = function ({
  doc,
  getCurrentBlock,
  entityMap,
  converter
}) {
  const currentBlock = getCurrentBlock();
  const { listNodeType, listItemNodeType } = getListNodeType(currentBlock.type);
  let container = doc;
  for (let depth = 0; depth < currentBlock.depth; depth++) {
    const listNode = container.content?.at(-1); // an existing (list?) node as the last child of the container
    if (listNode && isListNode(listNode)) {
      const listItem = listNode.content[listNode.content.length - 1]; // it's a list node, which is never empty
      container = listItem; // search for/add nested lists here
    } else {
      // there is no existing list at the necessary depth, constructed for a previous list item block
      // `currentBlock.depth` is too large, 2 or more higher than the previous block?
      // we can now either
      // * disregard the block:
      //   return false;
      // * create (usually schema-violating) nested lists until the specified depth:
      //   const listNode = addChild(container, createNode('list'))
      //   container = addChild(listNode, createNode('item'))
      // * or ignore the depth (and create a list at a lower level):
      break;
    }
  }
  let listNode = container.content?.at(-1); // an existing (list?) node as the last child of the container
  if (!listNode || listNode.type !== listNodeType) { // for the direct parent of the list item, we also care about the particular list type, not just that it's any list
    listNode = addChild(container, createNode(listNodeType))
  }

  addChild(
    listNode,
    createNode(listItemNodeType, {
      attrs: outerListItemNodeType === "taskItem" ? { checked: Boolean(currentBlock.data?.checked) } : undefined,
      content: [
        createNode("paragraph", {
          content: converter.splitTextByEntityRangesAndInlineStyleRanges({
            doc,
            block: currentBlock,
            entityMap
          })
        })
      ]
    })
  );

  return true;
};

const mapToHeadingNode: MapBlockToNodeFn = function ({
  block,
  entityMap,
  converter,
  doc,
}) {
  const headingLevel = {
    "header-one": 1,
    "header-two": 2,
    "header-three": 3,
    "header-four": 4,
    "header-five": 5,
    "header-six": 6,
  }[block.type];

  return createNode("heading", {
    attrs: { level: headingLevel || 1 },
    content: converter.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
      doc,
    }),
  });
};

const mapToTableNode: MapBlockToNodeFn = function ({
  doc,
  getCurrentBlock,
  entityMap,
  converter,
  peek,
  next,
}) {
  const table = createNode("table");
  let row = createNode("tableRow");
  let previousCellBlock = getCurrentBlock();
  do {
    if (previousCellBlock.depth + 1 !== getCurrentBlock().depth) {
      // Create new table row (since in drafttail, the depth increments by 100 when on a new row)
      row = createNode("tableRow");
      addChild(table, row);
    }
    // Add the new table cell
    addChild(
      row,
      createNode("tableCell", {
        content: [
          createNode("paragraph", {
            content: converter.splitTextByEntityRangesAndInlineStyleRanges({
              doc,
              block: getCurrentBlock(),
              entityMap,
            }),
          }),
        ],
      })
    );

    if (peek()?.type !== "table-cell") {
      break;
    }
    previousCellBlock = next()!;
  } while (true);

  return table;
};

export const blockToNodeMapping: Record<string, MapBlockToNodeFn> = {
  atomic({ doc, block, entityMap, converter }) {
    if (block.entityRanges.length === 0) {
      if (block.inlineStyleRanges.length === 0) {
        // Plain text, fast path
        return createText(block.text);
      }
    }
    // TODO atomic blocks use entities, to generate nodes
    // Does it make sense to wrap them in a paragraph?
    const paragraph = createNode("paragraph");
    const entities = block.entityRanges
      .map((range) => {
        return converter.mapEntityToNode({
          doc,
          block,
          range,
          entityMap,
          converter,
        });
      })
      .filter(Boolean);

    if (entities.length === 0) {
      return null;
    }

    return addChild(paragraph, entities);
  },
  "code-block"({ block }) {
    return addChild(createNode("codeBlock"), createText(block.text));
  },
  blockquote({ doc, block, entityMap, converter }) {
    return createNode("blockquote", {
      content: [
        createNode("paragraph", {
          content: converter.splitTextByEntityRangesAndInlineStyleRanges({
            doc,
            block,
            entityMap,
          }),
        }),
      ],
    });
  },
  unstyled: mapToParagraphNode,
  section: mapToParagraphNode,
  article: mapToParagraphNode,
  "unordered-list-item": addListItemBlock,
  "ordered-list-item": addListItemBlock,
  "checkable-list-item": addListItemBlock,
  "header-one": mapToHeadingNode,
  "header-two": mapToHeadingNode,
  "header-three": mapToHeadingNode,
  "header-four": mapToHeadingNode,
  "header-five": mapToHeadingNode,
  "header-six": mapToHeadingNode,
  "table-cell": mapToTableNode,
};

/**
 * Maps a Draft.js block to a ProseMirror node.
 */
export const mapBlockToNode: MapBlockToNodeFn = function (options) {
  const block = options.getCurrentBlock();
  if (blockToNodeMapping[block.type]) {
    return blockToNodeMapping[block.type](options);
  }

  return null;
};
