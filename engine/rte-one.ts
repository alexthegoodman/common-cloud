import * as fontkit from "fontkit";
import { v4 as uuidv4 } from "uuid";

export interface Style {
  color: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  italic: boolean;
  underline: boolean;
  isLineBreak: boolean;
}

export interface RenderItem {
  realChar: string;
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capHeight: number;
  format: Style;
  page: number;
  isLastOfLine: boolean;
}

export interface FontData {
  url: string;
  name: string;
  font?: fontkit.Font;
}

export interface DocumentSize {
  width: number;
  height: number;
}

export const defaultStyle: Style = {
  color: "black",
  fontSize: 16,
  fontWeight: "normal",
  fontFamily: "Aleo",
  italic: false,
  underline: false,
  isLineBreak: false,
};

enum NodeType {
  TEXT = "text",
  CONTAINER = "container",
  ROOT = "root",
}

interface NodeMetadata {
  isDirty: boolean;
  isLayoutDirty: boolean;
  lastUpdate: number;
  renderCacheValid: boolean;
  boundsCache?: {
    width: number;
    height: number;
    capHeight: number;
  };
}

interface LayoutData {
  x: number;
  y: number;
  width: number;
  height: number;
  capHeight: number;
  lineHeight: number;
  page: number;
  isLastOfLine: boolean;
}

class UnifiedTextNode {
  public id: string;
  public type: NodeType;
  public content: string;
  public style: Style;
  public children: UnifiedTextNode[];
  public parent: UnifiedTextNode | null;

  public startIndex: number;
  public endIndex: number;

  public metadata: NodeMetadata;
  public layout: LayoutData | null;
  public renderItems: RenderItem[];

  constructor(
    type: NodeType = NodeType.TEXT,
    content: string = "",
    style: Style = defaultStyle,
    startIndex: number = 0,
    endIndex: number = 0
  ) {
    this.id = uuidv4();
    this.type = type;
    this.content = content;
    this.style = { ...style };
    this.children = [];
    this.parent = null;

    this.startIndex = startIndex;
    this.endIndex = endIndex;

    this.metadata = {
      isDirty: true,
      isLayoutDirty: true,
      lastUpdate: Date.now(),
      renderCacheValid: false,
    };

    this.layout = null;
    this.renderItems = [];
  }

  markDirty(propagateUp: boolean = true) {
    this.metadata.isDirty = true;
    this.metadata.isLayoutDirty = true;
    this.metadata.renderCacheValid = false;
    this.metadata.lastUpdate = Date.now();

    if (propagateUp && this.parent) {
      this.parent.markDirty(true);
    }
  }

  markClean() {
    this.metadata.isDirty = false;
    this.metadata.isLayoutDirty = false;
    this.metadata.renderCacheValid = true;
  }

  addChild(child: UnifiedTextNode, index?: number): void {
    child.parent = this;
    if (typeof index === "number") {
      this.children.splice(index, 0, child);
    } else {
      this.children.push(child);
    }
    this.markDirty();
    this.updateIndices();
  }

  removeChild(childId: string): void {
    const index = this.children.findIndex((child) => child.id === childId);
    if (index !== -1) {
      const child = this.children[index];
      child.parent = null;
      this.children.splice(index, 1);
      this.markDirty();
      this.updateIndices();
    }
  }

  private updateIndices(): void {
    let currentIndex = this.startIndex;

    for (const child of this.children) {
      child.startIndex = currentIndex;
      child.endIndex = currentIndex + child.getTextLength();
      currentIndex = child.endIndex;

      if (child.children.length > 0) {
        child.updateIndices();
      }
    }

    this.endIndex = currentIndex;
  }

  getTextLength(): number {
    if (this.type === NodeType.TEXT) {
      return this.content.length;
    }

    return this.children.reduce((sum, child) => sum + child.getTextLength(), 0);
  }

  getText(): string {
    if (this.type === NodeType.TEXT) {
      return this.content;
    }

    return this.children.map((child) => child.getText()).join("");
  }

  findNodeAtIndex(index: number): UnifiedTextNode | null {
    if (index < this.startIndex || index >= this.endIndex) {
      return null;
    }

    if (this.type === NodeType.TEXT) {
      return this;
    }

    for (const child of this.children) {
      const result = child.findNodeAtIndex(index);
      if (result) {
        return result;
      }
    }

    return this;
  }

  findNodesInRange(startIndex: number, endIndex: number): UnifiedTextNode[] {
    const results: UnifiedTextNode[] = [];

    if (endIndex <= this.startIndex || startIndex >= this.endIndex) {
      return results;
    }

    if (this.type === NodeType.TEXT) {
      if (startIndex <= this.startIndex && endIndex >= this.endIndex) {
        results.push(this);
      }
      return results;
    }

    for (const child of this.children) {
      results.push(...child.findNodesInRange(startIndex, endIndex));
    }

    return results;
  }

  collectDirtyNodes(): UnifiedTextNode[] {
    const dirtyNodes: UnifiedTextNode[] = [];

    if (this.metadata.isDirty) {
      dirtyNodes.push(this);
    }

    for (const child of this.children) {
      dirtyNodes.push(...child.collectDirtyNodes());
    }

    return dirtyNodes;
  }

  split(index: number): UnifiedTextNode | null {
    if (
      this.type !== NodeType.TEXT ||
      index <= 0 ||
      index >= this.content.length
    ) {
      return null;
    }

    const rightContent = this.content.substring(index);
    const rightNode = new UnifiedTextNode(
      NodeType.TEXT,
      rightContent,
      { ...this.style },
      this.startIndex + index,
      this.endIndex
    );

    this.content = this.content.substring(0, index);
    this.endIndex = this.startIndex + index;

    if (this.parent) {
      const childIndex = this.parent.children.indexOf(this);
      this.parent.addChild(rightNode, childIndex + 1);
    }

    this.markDirty();
    return rightNode;
  }

  merge(otherNode: UnifiedTextNode): boolean {
    if (
      this.type !== NodeType.TEXT ||
      otherNode.type !== NodeType.TEXT ||
      !this.styleEquals(otherNode.style)
    ) {
      return false;
    }

    this.content += otherNode.content;
    this.endIndex = otherNode.endIndex;

    if (this.parent && otherNode.parent === this.parent) {
      this.parent.removeChild(otherNode.id);
    }

    this.markDirty();
    return true;
  }

  styleEquals(otherStyle: Style): boolean {
    return (
      this.style.color === otherStyle.color &&
      this.style.fontSize === otherStyle.fontSize &&
      this.style.fontWeight === otherStyle.fontWeight &&
      this.style.fontFamily === otherStyle.fontFamily &&
      this.style.italic === otherStyle.italic &&
      this.style.underline === otherStyle.underline &&
      this.style.isLineBreak === otherStyle.isLineBreak
    );
  }
}

interface CacheEntry {
  char: string;
  style: Style;
  width: number;
  height: number;
  capHeight: number;
  timestamp: number;
}

class FontMetricsCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 10000;

  private getCacheKey(char: string, style: Style): string {
    return `${char}_${style.fontFamily}_${style.fontSize}_${style.fontWeight}_${style.italic}`;
  }

  get(char: string, style: Style): CacheEntry | null {
    const key = this.getCacheKey(char, style);
    return this.cache.get(key) || null;
  }

  set(
    char: string,
    style: Style,
    metrics: Omit<CacheEntry, "char" | "style" | "timestamp">
  ): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getCacheKey(char, style);
    this.cache.set(key, {
      char,
      style: { ...style },
      ...metrics,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class UnifiedRichTextEditor {
  private root: UnifiedTextNode;
  private fontData: FontData[];
  private documentSize: DocumentSize;
  private metricsCache: FontMetricsCache;

  constructor(documentSize: DocumentSize, fontData: FontData[]) {
    this.root = new UnifiedTextNode(NodeType.ROOT);
    this.fontData = fontData;
    this.documentSize = documentSize;
    this.metricsCache = new FontMetricsCache();
  }

  getText(): string {
    return this.root.getText();
  }

  getTextLength(): number {
    return this.root.getTextLength();
  }

  insert(index: number, text: string, style: Style = defaultStyle): void {
    performance.mark("unified-insert-start");

    const targetNode = this.root.findNodeAtIndex(index);
    if (!targetNode) {
      this.root.addChild(
        new UnifiedTextNode(
          NodeType.TEXT,
          text,
          style,
          index,
          index + text.length
        )
      );
      performance.mark("unified-insert-end");
      performance.measure(
        "unified-insert",
        "unified-insert-start",
        "unified-insert-end"
      );
      return;
    }

    if (targetNode.type === NodeType.TEXT) {
      const localIndex = index - targetNode.startIndex;

      if (localIndex === 0 && targetNode.styleEquals(style)) {
        targetNode.content = text + targetNode.content;
        targetNode.endIndex += text.length;
        targetNode.markDirty();
      } else if (
        localIndex === targetNode.content.length &&
        targetNode.styleEquals(style)
      ) {
        targetNode.content = targetNode.content + text;
        targetNode.endIndex += text.length;
        targetNode.markDirty();
      } else {
        if (localIndex > 0 && localIndex < targetNode.content.length) {
          targetNode.split(localIndex);
        }

        const newNode = new UnifiedTextNode(
          NodeType.TEXT,
          text,
          style,
          index,
          index + text.length
        );
        if (targetNode.parent) {
          const childIndex = targetNode.parent.children.indexOf(targetNode);
          const insertIndex = localIndex === 0 ? childIndex : childIndex + 1;
          targetNode.parent.addChild(newNode, insertIndex);
        }
      }
    }

    this.updateIndicesAfterInsertion(index, text.length);
    performance.mark("unified-insert-end");
    performance.measure(
      "unified-insert",
      "unified-insert-start",
      "unified-insert-end"
    );
  }

  delete(startIndex: number, endIndex: number): void {
    performance.mark("unified-delete-start");

    const affectedNodes = this.root.findNodesInRange(startIndex, endIndex);
    const deleteLength = endIndex - startIndex;

    for (const node of affectedNodes) {
      if (node.type === NodeType.TEXT) {
        const nodeStart = Math.max(startIndex, node.startIndex);
        const nodeEnd = Math.min(endIndex, node.endIndex);
        const localStart = nodeStart - node.startIndex;
        const localEnd = nodeEnd - node.startIndex;

        if (localStart === 0 && localEnd === node.content.length) {
          if (node.parent) {
            node.parent.removeChild(node.id);
          }
        } else {
          node.content =
            node.content.substring(0, localStart) +
            node.content.substring(localEnd);
          node.endIndex -= localEnd - localStart;
          node.markDirty();
        }
      }
    }

    this.updateIndicesAfterDeletion(startIndex, deleteLength);
    performance.mark("unified-delete-end");
    performance.measure(
      "unified-delete",
      "unified-delete-start",
      "unified-delete-end"
    );
  }

  applyStyle(
    startIndex: number,
    endIndex: number,
    styleChanges: Partial<Style>
  ): void {
    const affectedNodes = this.root.findNodesInRange(startIndex, endIndex);

    for (const node of affectedNodes) {
      if (node.type === NodeType.TEXT) {
        const newStyle = { ...node.style, ...styleChanges };

        const nodeStart = Math.max(startIndex, node.startIndex);
        const nodeEnd = Math.min(endIndex, node.endIndex);

        if (nodeStart === node.startIndex && nodeEnd === node.endIndex) {
          node.style = newStyle;
          node.markDirty();
        } else {
          const localStart = nodeStart - node.startIndex;
          const localEnd = nodeEnd - node.startIndex;

          if (localStart > 0) {
            node.split(localStart);
          }

          const middleNode = node.parent?.children.find(
            (child) =>
              child.startIndex === nodeStart && child.endIndex <= nodeEnd
          );

          if (middleNode && localEnd < node.content.length) {
            middleNode.split(localEnd - localStart);
          }

          if (middleNode) {
            middleNode.style = newStyle;
            middleNode.markDirty();
          }
        }
      }
    }
  }

  private updateIndicesAfterInsertion(index: number, length: number): void {
    this.traverseAndUpdateIndices(this.root, (node) => {
      if (node.startIndex >= index) {
        node.startIndex += length;
        node.endIndex += length;
      } else if (node.endIndex > index) {
        node.endIndex += length;
      }
    });
  }

  private updateIndicesAfterDeletion(index: number, length: number): void {
    this.traverseAndUpdateIndices(this.root, (node) => {
      if (node.startIndex >= index + length) {
        node.startIndex -= length;
        node.endIndex -= length;
      } else if (node.endIndex > index) {
        node.endIndex = Math.max(index, node.endIndex - length);
      }
    });
  }

  private traverseAndUpdateIndices(
    node: UnifiedTextNode,
    updateFn: (node: UnifiedTextNode) => void
  ): void {
    updateFn(node);
    for (const child of node.children) {
      this.traverseAndUpdateIndices(child, updateFn);
    }
  }

  private getCharacterMetrics(
    char: string,
    style: Style
  ): { width: number; height: number; capHeight: number } {
    const cached = this.metricsCache.get(char, style);
    if (cached) {
      return {
        width: cached.width,
        height: cached.height,
        capHeight: cached.capHeight,
      };
    }

    try {
      const fontData = this.fontData.find(
        (data) => data.name === style.fontFamily
      )?.font;
      if (!fontData) {
        return { width: 8, height: 16, capHeight: 16 };
      }

      const glyph = fontData.layout(char);
      const boundingBox = glyph?.bbox;
      const unitsPerEm = fontData.unitsPerEm;

      if (
        !boundingBox ||
        boundingBox.width === -Infinity ||
        boundingBox.height === -Infinity ||
        !unitsPerEm
      ) {
        return { width: 8, height: 16, capHeight: 16 };
      }

      const width = (boundingBox.width / unitsPerEm) * style.fontSize;
      const height = (boundingBox.height / unitsPerEm) * style.fontSize;
      const capHeight =
        ((fontData.capHeight + fontData.ascent + fontData.descent) /
          unitsPerEm) *
        style.fontSize;

      const metrics = { width, height, capHeight };
      this.metricsCache.set(char, style, metrics);

      return metrics;
    } catch (error) {
      console.error("Error calculating character metrics:", error);
      return { width: 8, height: 16, capHeight: 16 };
    }
  }

  render(): RenderItem[] {
    performance.mark("unified-render-start");

    const dirtyNodes = this.root.collectDirtyNodes();

    if (dirtyNodes.length === 0 && this.root.renderItems.length > 0) {
      performance.mark("unified-render-end");
      performance.measure(
        "unified-render",
        "unified-render-start",
        "unified-render-end"
      );
      return this.root.renderItems;
    }

    const renderItems: RenderItem[] = [];
    let currentX = 0;
    let currentY = 0;
    let lineHeight = 0;
    let currentPage = 0;

    const processNode = (node: UnifiedTextNode) => {
      if (node.type === NodeType.TEXT) {
        for (let i = 0; i < node.content.length; i++) {
          const char = node.content[i];

          if (char === "\n") {
            currentX = 0;
            currentY += lineHeight;
            lineHeight = 0;
            continue;
          }

          const metrics = this.getCharacterMetrics(char, node.style);
          lineHeight = Math.max(lineHeight, metrics.capHeight);

          if (currentX + metrics.width > this.documentSize.width) {
            currentX = 0;
            currentY += lineHeight;
            lineHeight = metrics.capHeight;
          }

          if (currentY + metrics.capHeight > this.documentSize.height) {
            currentPage++;
            currentY = 0;
          }

          renderItems.push({
            realChar: char,
            char: char,
            x: currentX,
            y: currentY,
            width: metrics.width,
            height: metrics.height,
            capHeight: metrics.capHeight,
            format: { ...node.style },
            page: currentPage,
            isLastOfLine: currentX + metrics.width >= this.documentSize.width,
          });

          currentX += metrics.width + 1;
        }
      } else {
        for (const child of node.children) {
          processNode(child);
        }
      }
    };

    processNode(this.root);

    for (const node of dirtyNodes) {
      node.markClean();
    }

    this.root.renderItems = renderItems;

    performance.mark("unified-render-end");
    performance.measure(
      "unified-render",
      "unified-render-start",
      "unified-render-end"
    );

    return renderItems;
  }

  renderRange(startIndex: number, endIndex: number): RenderItem[] {
    const relevantNodes = this.root.findNodesInRange(startIndex, endIndex);
    const renderItems: RenderItem[] = [];

    let currentX = 0;
    let currentY = 0;
    let lineHeight = 0;
    let currentPage = 0;

    for (const node of relevantNodes) {
      if (node.type === NodeType.TEXT) {
        const nodeStart = Math.max(startIndex, node.startIndex);
        const nodeEnd = Math.min(endIndex, node.endIndex);
        const localStart = nodeStart - node.startIndex;
        const localEnd = nodeEnd - node.startIndex;

        for (let i = localStart; i < localEnd; i++) {
          const char = node.content[i];

          if (char === "\n") {
            currentX = 0;
            currentY += lineHeight;
            lineHeight = 0;
            continue;
          }

          const metrics = this.getCharacterMetrics(char, node.style);
          lineHeight = Math.max(lineHeight, metrics.capHeight);

          if (currentX + metrics.width > this.documentSize.width) {
            currentX = 0;
            currentY += lineHeight;
            lineHeight = metrics.capHeight;
          }

          if (currentY + metrics.capHeight > this.documentSize.height) {
            currentPage++;
            currentY = 0;
          }

          renderItems.push({
            realChar: char,
            char: char,
            x: currentX,
            y: currentY,
            width: metrics.width,
            height: metrics.height,
            capHeight: metrics.capHeight,
            format: { ...node.style },
            page: currentPage,
            isLastOfLine: currentX + metrics.width >= this.documentSize.width,
          });

          currentX += metrics.width + 1;
        }
      }
    }

    return renderItems;
  }

  getDirtyNodeCount(): number {
    return this.root.collectDirtyNodes().length;
  }

  clearCache(): void {
    this.metricsCache.clear();
  }
}
