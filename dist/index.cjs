"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DraftConverter: () => DraftConverter,
  addChild: () => addChild,
  addChildToList: () => addChildToList,
  addMark: () => addMark,
  blockToNodeMapping: () => blockToNodeMapping,
  createDocument: () => createDocument,
  createMark: () => createMark,
  createNode: () => createNode,
  createText: () => createText,
  entityToMarkMapping: () => entityToMarkMapping,
  entityToNodeMapping: () => entityToNodeMapping,
  inlineStyleToMarkMapping: () => inlineStyleToMarkMapping,
  isDocument: () => isDocument,
  isDraftJSContent: () => isDraftJSContent,
  isEntityRange: () => isEntityRange,
  isInlineStyleRange: () => isInlineStyleRange,
  isListNode: () => isListNode,
  isNode: () => isNode,
  isText: () => isText,
  mapBlockToNode: () => mapBlockToNode,
  mapEntityToMark: () => mapEntityToMark,
  mapEntityToNode: () => mapEntityToNode,
  mapInlineStyleToMark: () => mapInlineStyleToMark
});
module.exports = __toCommonJS(index_exports);

// src/utils/draft.ts
function isInlineStyleRange(range) {
  return "style" in range;
}
function isEntityRange(range) {
  return "key" in range;
}
function isDraftJSContent(node) {
  return typeof node === "object" && node !== null && "blocks" in node && "entityMap" in node;
}

// src/utils/pm.ts
function addChild(node, child) {
  if (!node && !child) {
    throw new Error("Cannot add a null child to a null parent.");
  }
  if (!child) {
    return node;
  }
  if (!node.content) {
    node.content = [];
  }
  if (Array.isArray(child)) {
    node.content.push.apply(node.content, child);
  } else {
    node.content.push(child);
  }
  return node;
}
function addMark(node, mark) {
  if (!node && !mark) {
    throw new Error("Cannot add a null mark to a null node.");
  }
  if (!mark) {
    return node;
  }
  if (!node.marks) {
    node.marks = [];
  }
  if (Array.isArray(mark)) {
    node.marks.push.apply(node.marks, mark.filter(Boolean));
  } else {
    node.marks.push(mark);
  }
  return node;
}
function createNode(type, options) {
  return { type, ...options };
}
function createMark(type, options) {
  return { type, ...options };
}
function createDocument() {
  return { type: "doc", content: [] };
}
function createText(text, marks) {
  if (!text) return null;
  return { type: "text", text, ...marks && { marks } };
}
function isDocument(node) {
  return typeof node === "object" && node !== null && "type" in node && node.type === "doc";
}
function isText(node) {
  return typeof node === "object" && node !== null && "type" in node && node.type === "text";
}
function isNode(node) {
  return typeof node === "object" && node !== null && "type" in node && node.type !== "text";
}
function isListNode(node) {
  return Boolean(
    node && (node.type === "bulletList" || node.type === "orderedList" || node.type === "taskList")
  );
}
function addChildToList(parent, child, append = true) {
  if (!isListNode(parent)) {
    addChild(parent, child);
    return;
  }
  if (child.type === "listItem") {
    addChild(parent, child);
    return;
  }
  if (child.type === "orderedList" || child.type === "bulletList") {
    if (append && parent.content) {
      const lastChild = parent.content[parent.content.length - 1];
      if (lastChild) {
        addChild(lastChild, child);
        return;
      }
    }
  }
  if (child.type === "paragraph" && (child.content || []).length === 0) {
    return;
  }
  child = addChild(createNode("listItem"), child);
  addChild(parent, child);
}

// src/mappings/blockToNode.ts
var getListNodeType = (blockType) => {
  switch (blockType) {
    case "checkable-list-item":
      return {
        listNodeType: "taskList",
        listItemNodeType: "taskItem"
      };
    case "unordered-list-item":
      return {
        listNodeType: "bulletList",
        listItemNodeType: "listItem"
      };
    default:
      return {
        listNodeType: "orderedList",
        listItemNodeType: "listItem"
      };
  }
};
var mapToListNode = function({
  doc,
  getCurrentBlock,
  entityMap,
  peek,
  next,
  converter
}) {
  const { listNodeType: outerListNodeType, listItemNodeType: outerListItemNodeType } = getListNodeType(getCurrentBlock().type);
  const outerListNode = createNode(outerListNodeType);
  while (true) {
    let listNode = outerListNode;
    const currentBlock = getCurrentBlock();
    const { listNodeType: innerListNodeType } = getListNodeType(currentBlock.type);
    let depth = 0;
    while (depth < currentBlock.depth) {
      if (!listNode.content?.length) {
        listNode.content = [];
      }
      let mostRecentListItem = listNode.content[listNode.content.length - 1];
      if (!mostRecentListItem) {
        mostRecentListItem = createNode(outerListItemNodeType);
        addChild(listNode, mostRecentListItem);
      }
      let nextMostRecentList = mostRecentListItem.content?.[mostRecentListItem.content.length - 1];
      if (isListNode(nextMostRecentList)) {
        listNode = nextMostRecentList;
        depth++;
      } else {
        nextMostRecentList = createNode(innerListNodeType);
        addChild(mostRecentListItem, nextMostRecentList);
        listNode = nextMostRecentList;
        break;
      }
    }
    addChild(
      listNode,
      // "bulletList" and "orderedList" could nest each other but not "taskList" and vice versa
      createNode(outerListItemNodeType, {
        ...outerListItemNodeType === "taskItem" ? { attrs: { checked: Boolean(currentBlock.data?.checked) } } : {},
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
    const nextBlock = peek();
    if (!(nextBlock && nextBlock.type === "unordered-list-item" || nextBlock && nextBlock.type === "ordered-list-item" || nextBlock && nextBlock.type === "checkable-list-item")) {
      break;
    }
    if (nextBlock && nextBlock.type !== currentBlock.type) {
      break;
    }
    next();
  }
  return outerListNode;
};
var mapToHeadingNode = function({
  block,
  entityMap,
  converter,
  doc
}) {
  const headingLevel = {
    "header-one": 1,
    "header-two": 2,
    "header-three": 3,
    "header-four": 4,
    "header-five": 5,
    "header-six": 6
  }[block.type];
  return createNode("heading", {
    attrs: { level: headingLevel || 1 },
    content: converter.splitTextByEntityRangesAndInlineStyleRanges({
      block,
      entityMap,
      doc
    })
  });
};
var mapToTableNode = function({
  doc,
  getCurrentBlock,
  entityMap,
  converter,
  peek,
  next
}) {
  const table = createNode("table");
  let row = createNode("tableRow");
  let previousCellBlock = getCurrentBlock();
  do {
    if (previousCellBlock.depth + 1 !== getCurrentBlock().depth) {
      row = createNode("tableRow");
      addChild(table, row);
    }
    addChild(
      row,
      createNode("tableCell", {
        content: [
          createNode("paragraph", {
            content: converter.splitTextByEntityRangesAndInlineStyleRanges({
              doc,
              block: getCurrentBlock(),
              entityMap
            })
          })
        ]
      })
    );
    if (peek()?.type !== "table-cell") {
      break;
    }
    previousCellBlock = next();
  } while (true);
  return table;
};
var blockToNodeMapping = {
  atomic({ doc, block, entityMap, converter }) {
    if (block.entityRanges.length === 0) {
      if (block.inlineStyleRanges.length === 0) {
        return createText(block.text);
      }
    }
    const paragraph = createNode("paragraph");
    const entities = block.entityRanges.map((range) => {
      return converter.mapEntityToNode({
        doc,
        block,
        range,
        entityMap,
        converter
      });
    }).filter(Boolean);
    if (entities.length === 0) {
      return null;
    }
    return addChild(paragraph, entities);
  },
  "code-block"({ block }) {
    return createNode("codeBlock", {
      content: [createText(block.text)]
    });
  },
  blockquote({ doc, block, entityMap, converter }) {
    return createNode("blockquote", {
      content: [
        createNode("paragraph", {
          content: converter.splitTextByEntityRangesAndInlineStyleRanges({
            doc,
            block,
            entityMap
          })
        })
      ]
    });
  },
  unstyled({ doc, block, entityMap, converter }) {
    const paragraph = createNode("paragraph");
    if (block.inlineStyleRanges.length === 0) {
      if (block.entityRanges.length === 0) {
        return addChild(paragraph, createText(block.text));
      }
    }
    return addChild(
      paragraph,
      converter.splitTextByEntityRangesAndInlineStyleRanges({
        doc,
        block,
        entityMap
      })
    );
  },
  "unordered-list-item": mapToListNode,
  "ordered-list-item": mapToListNode,
  "checkable-list-item": mapToListNode,
  "header-one": mapToHeadingNode,
  "header-two": mapToHeadingNode,
  "header-three": mapToHeadingNode,
  "header-four": mapToHeadingNode,
  "header-five": mapToHeadingNode,
  "header-six": mapToHeadingNode,
  "table-cell": mapToTableNode
};
var mapBlockToNode = function(options) {
  const block = options.getCurrentBlock();
  if (blockToNodeMapping[block.type]) {
    return blockToNodeMapping[block.type](options);
  }
  return null;
};

// src/mappings/entityToMark.ts
var entityToMarkMapping = {
  LINK: ({ entity }) => {
    return {
      type: "link",
      attrs: {
        href: entity.data.url,
        target: entity.data.target
      }
    };
  }
};
var mapEntityToMark = function({
  range: { key },
  entityMap,
  converter
}) {
  if (entityToMarkMapping[entityMap[key].type]) {
    return entityToMarkMapping[entityMap[key].type]({
      entity: entityMap[key],
      converter
    });
  }
  return null;
};

// src/mappings/entityToNode.ts
var entityToNodeMapping = {
  HORIZONTAL_RULE: () => {
    return createNode("horizontalRule");
  },
  IMAGE: ({ entity }) => {
    return createNode("image", {
      attrs: {
        src: entity.data.src,
        alt: entity.data.alt
      }
    });
  }
};
var mapEntityToNode = function({
  range: { key },
  entityMap,
  converter
}) {
  if (entityToNodeMapping[entityMap[key].type]) {
    return entityToNodeMapping[entityMap[key].type]({
      entity: entityMap[key],
      converter
    });
  }
  return null;
};

// src/mappings/inlineStyleToMark.ts
var inlineStyleToMarkMapping = {
  BOLD: { type: "bold" },
  CODE: { type: "code" },
  KEYBOARD: { type: "code" },
  ITALIC: { type: "italic" },
  STRIKETHROUGH: { type: "strike" },
  UNDERLINE: { type: "underline" },
  SUBSCRIPT: { type: "subscript" },
  SUPERSCRIPT: { type: "superscript" },
  HIGHLIGHT: { type: "highlight" }
};
var mapInlineStyleToMark = function({
  range: { style }
}) {
  if (inlineStyleToMarkMapping[style]) {
    return inlineStyleToMarkMapping[style];
  }
  if (style.startsWith("bgcolor-")) {
    return {
      type: "highlight",
      attrs: {
        color: style.replace("bgcolor-", "")
      }
    };
  }
  if (style.startsWith("fontfamily-")) {
    return {
      type: "textStyle",
      attrs: {
        fontFamily: style.replace("fontfamily-", "")
      }
    };
  }
  return null;
};

// src/draftConverter.ts
var DraftConverter = class {
  /**
   * Any unmatched blocks, entities, or inline styles that were not converted.
   */
  unmatched = {
    blocks: [],
    entities: {},
    inlineStyles: []
  };
  options;
  constructor(options) {
    this.options = {
      mapBlockToNode,
      mapInlineStyleToMark,
      mapEntityToMark,
      mapEntityToNode,
      ...options
    };
  }
  createNode = createNode;
  addChild = addChild;
  createText = createText;
  addMark = addMark;
  mapRangeToMark({
    range,
    entityMap,
    doc,
    block
  }) {
    if (isInlineStyleRange(range)) {
      try {
        const inlineStyle = this.options.mapInlineStyleToMark({
          range,
          converter: this,
          doc,
          block
        }) ?? null;
        if (inlineStyle) {
          return inlineStyle;
        }
      } catch (e) {
        console.error(e);
      }
      this.unmatched.inlineStyles.push(range);
      return null;
    }
    try {
      const entity = this.options.mapEntityToMark({
        range,
        entityMap,
        converter: this,
        doc,
        block
      }) ?? null;
      if (entity) {
        return entity;
      }
    } catch (e) {
      console.error(e);
    }
    this.unmatched.entities[range.key] = entityMap[range.key];
    return null;
  }
  mapBlockToNode = (options) => {
    let didConsume = null;
    try {
      didConsume = this.options.mapBlockToNode.call(this, options) ?? null;
    } catch (e) {
      console.error(e);
    }
    if (didConsume === null) {
      this.unmatched.blocks.push(options.getCurrentBlock());
    }
    return didConsume;
  };
  mapEntityToNode = ({ range, entityMap, doc, block }) => {
    try {
      const node = this.options.mapEntityToNode({
        range,
        entityMap,
        converter: this,
        doc,
        block
      });
      if (node) {
        return node;
      }
    } catch (e) {
      console.error(e);
    }
    this.unmatched.entities[range.key] = entityMap[range.key];
    return null;
  };
  /**
   * This function splits a text into Nodes based on the entity ranges and inline style ranges.
   * Applying them as marks to the text. Which may overlap in their ranges.
   */
  splitTextByEntityRangesAndInlineStyleRanges(options) {
    const allRanges = [
      ...options.block.entityRanges,
      ...options.block.inlineStyleRanges
    ].sort((a, b) => {
      if (a.offset === b.offset) {
        return a.length - b.length;
      }
      return a.offset - b.offset;
    });
    let result = [];
    let stylesAtPosition = {};
    for (let range of allRanges) {
      for (let i = range.offset; i < range.offset + range.length; i++) {
        if (!stylesAtPosition[i]) {
          stylesAtPosition[i] = [];
        }
        stylesAtPosition[i].push(range);
      }
    }
    let currentRanges = [];
    let currentText = "";
    const text = Array.from(options.block.text);
    for (let i = 0; i < text.length; i++) {
      let styles = stylesAtPosition[i] || [];
      if (styles.length !== currentRanges.length || !styles.every((style) => currentRanges.includes(style))) {
        if (currentText) {
          result.push({ text: currentText, ranges: currentRanges });
        }
        currentText = "";
        currentRanges = styles;
      }
      currentText += text[i];
    }
    if (currentText) {
      result.push({ text: currentText, ranges: currentRanges });
    }
    return result.map(({ text: text2, ranges }) => {
      const textNode = createText(text2);
      ranges.forEach(
        (range) => addMark(
          textNode,
          this.mapRangeToMark({
            range,
            entityMap: options.entityMap,
            doc: options.doc,
            block: options.block
          })
        )
      );
      return textNode;
    });
  }
  convert(draft) {
    this.unmatched = {
      blocks: [],
      entities: {},
      inlineStyles: []
    };
    const doc = createDocument();
    let i = 0;
    const ctx = {
      get index() {
        return i;
      },
      setIndex: (index) => {
        i = index;
      },
      get block() {
        return draft.blocks[i];
      },
      allBlocks: draft.blocks,
      get doc() {
        return doc;
      },
      entityMap: draft.entityMap,
      peek: () => draft.blocks[i + 1] || null,
      peekPrev: () => draft.blocks[i - 1] || null,
      getCurrentBlock: () => draft.blocks[i],
      next: () => draft.blocks[i++] || null,
      prev: () => draft.blocks[i--] || null,
      converter: this
    };
    for (; i < draft.blocks.length; i++) {
      const mapped = this.mapBlockToNode.call(this, ctx);
      if (typeof mapped !== "boolean") {
        if (mapped) {
          this.addChild(doc, mapped);
        }
      }
    }
    return doc;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DraftConverter,
  addChild,
  addChildToList,
  addMark,
  blockToNodeMapping,
  createDocument,
  createMark,
  createNode,
  createText,
  entityToMarkMapping,
  entityToNodeMapping,
  inlineStyleToMarkMapping,
  isDocument,
  isDraftJSContent,
  isEntityRange,
  isInlineStyleRange,
  isListNode,
  isNode,
  isText,
  mapBlockToNode,
  mapEntityToMark,
  mapEntityToNode,
  mapInlineStyleToMark
});
