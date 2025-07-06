#!/usr/bin/env node

// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import {
//   CallToolRequestSchema,
//   ListToolsRequestSchema,
//   Tool,
// } from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import { unknown, z } from "zod";

// Import types from your engine
import {
  SavedState,
  Sequence,
  ObjectType,
  BackgroundFill,
  AnimationData,
  AnimationProperty,
  UIKeyframe,
  KeyframeValue,
  EasingType,
  PathType,
  CurveData,
  KeyType,
} from "./engine/animations.js";
import { SavedPolygonConfig } from "./engine/polygon.js";
import { SavedTextRendererConfig } from "./engine/text.js";
import { SavedStImageConfig } from "./engine/image.js";
import { SavedStVideoConfig } from "./engine/video.js";

// Zod schema definitions for MCP tools
const AddPolygonSchema = {
  projectId: z.string().describe("ID of the project to add the polygon to"),
  sequenceId: z.string().describe("ID of the sequence to add the polygon to"),
  name: z.string().describe("Name of the polygon"),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .describe("Position of the polygon"),
  dimensions: z
    .array(z.number())
    .length(2)
    .describe("Width and height [width, height]"),
  backgroundFill: z
    .object({
      Solid: z.array(z.number()).length(4).optional(),
    })
    .describe("Background fill (solid color [r, g, b, a])"),
  borderRadius: z.number().default(0).describe("Border radius"),
  isCircle: z
    .boolean()
    .default(false)
    .describe("Whether the polygon is a circle"),
  layer: z.number().default(1).describe("Layer index"),
};

const AddTextSchema = {
  projectId: z.string().describe("ID of the project to add the text to"),
  sequenceId: z.string().describe("ID of the sequence to add the text to"),
  name: z.string().describe("Name of the text item"),
  text: z.string().describe("Text content"),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .describe("Position of the text"),
  dimensions: z
    .array(z.number())
    .length(2)
    .describe("Width and height [width, height]"),
  fontFamily: z.string().default("Arial").describe("Font family"),
  fontSize: z.number().default(24).describe("Font size"),
  color: z
    .array(z.number())
    .length(4)
    .default([0, 0, 0, 1])
    .describe("Text color [r, g, b, a]"),
  backgroundFill: z
    .object({
      Solid: z.array(z.number()).length(4).optional(),
    })
    .describe("Background fill (solid color [r, g, b, a])"),
  isCircle: z
    .boolean()
    .default(false)
    .describe("Whether the text background is circular"),
  layer: z.number().default(1).describe("Layer index"),
};

const AddImageSchema = {
  projectId: z.string().describe("ID of the project to add the image to"),
  sequenceId: z.string().describe("ID of the sequence to add the image to"),
  name: z.string().describe("Name of the image item"),
  url: z.string().describe("URL or path to the image"),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .describe("Position of the image"),
  dimensions: z
    .array(z.number())
    .length(2)
    .describe("Width and height [width, height]"),
  isCircle: z
    .boolean()
    .default(false)
    .describe("Whether the image is circular"),
  isSticker: z
    .boolean()
    .default(false)
    .describe("Whether this is a sticker image"),
  layer: z.number().default(1).describe("Layer index"),
};

const AddVideoSchema = {
  projectId: z.string().describe("ID of the project to add the video to"),
  sequenceId: z.string().describe("ID of the sequence to add the video to"),
  name: z.string().describe("Name of the video item"),
  path: z.string().describe("Path to the video file"),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .describe("Position of the video"),
  dimensions: z
    .array(z.number())
    .length(2)
    .describe("Width and height [width, height]"),
  layer: z.number().default(1).describe("Layer index"),
};

const GetProjectInfoSchema = {
  projectId: z.string().describe("ID of the project to get info for"),
};

const ListUserProjectsSchema = {
  userId: z.string().describe("ID of the user to list projects for"),
};

const GetProjectByNameSchema = {
  userId: z.string().describe("ID of the user who owns the project"),
  projectName: z.string().describe("Name of the project to find"),
};

const CreateSequenceSchema = {
  projectId: z.string().describe("ID of the project to create sequence in"),
  name: z.string().describe("Name of the new sequence"),
  durationMs: z.number().default(5000).describe("Duration in milliseconds"),
  backgroundFill: z
    .object({
      Solid: z.array(z.number()).length(4).optional(),
    })
    .optional()
    .describe("Background fill for the sequence"),
};

const AddKeyframesSchema = {
  projectId: z.string().describe("ID of the project"),
  sequenceId: z.string().describe("ID of the sequence"),
  objectId: z.string().describe("ID of the object to add keyframes to"),
  propertyName: z
    .string()
    .describe(
      "Name of the property (position, scaleX, scaleY, rotation, opacity, etc.)"
    ),
  keyframes: z
    .array(
      z.object({
        time: z.number().describe("Time in milliseconds"),
        value: z
          .union([
            z.array(z.number()).length(2), // Position [x, y]
            z.number(), // Single value for rotation, scale, opacity, etc.
          ])
          .describe("Keyframe value"),
        easing: z
          .enum(["Linear", "EaseIn", "EaseOut", "EaseInOut"])
          .default("Linear")
          .describe("Easing type"),
        pathType: z
          .enum(["Linear", "Bezier"])
          .default("Linear")
          .describe("Path type"),
      })
    )
    .describe("Array of keyframes to add"),
};

const BulkAddKeyframesSchema = {
  projectId: z.string().describe("ID of the project"),
  sequenceId: z.string().describe("ID of the sequence"),
  keyframeData: z
    .array(
      z.object({
        objectId: z.string().describe("ID of the object"),
        propertyName: z.string().describe("Name of the property"),
        keyframes: z
          .array(
            z.object({
              time: z.number().describe("Time in milliseconds"),
              value: z
                .union([
                  z.array(z.number()).length(2), // Position [x, y]
                  z.number(), // Single value for rotation, scale, opacity, etc.
                ])
                .describe("Keyframe value"),
              easing: z
                .enum(["Linear", "EaseIn", "EaseOut", "EaseInOut"])
                .default("Linear")
                .describe("Easing type"),
              pathType: z
                .enum(["Linear", "Bezier"])
                .default("Linear")
                .describe("Path type"),
            })
          )
          .describe("Array of keyframes"),
      })
    )
    .describe("Array of keyframe data for multiple objects and properties"),
};

const CreateProjectSchema = {
  userId: z.string().describe("ID of the user who will own the project"),
  name: z.string().describe("Name of the new project"),
  public: z
    .boolean()
    .default(false)
    .describe("Whether the project should be public"),
  isTemplate: z
    .boolean()
    .default(false)
    .describe("Whether the project is a template"),
  isFeatured: z
    .boolean()
    .default(false)
    .describe("Whether the project is featured"),
};

class VideoProjectMCPServer {
  private server: McpServer;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.server = new McpServer(
      {
        name: "video-project-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // Register each tool using the modern registerTool API
    this.server.registerTool(
      "add_polygon",
      {
        description: "Add a polygon object to a video project sequence",
        inputSchema: AddPolygonSchema,
      },
      async (args) => {
        return (await this.addPolygon(args)) as any;
      }
    );

    this.server.registerTool(
      "add_text",
      {
        description: "Add a text object to a video project sequence",
        inputSchema: AddTextSchema,
      },
      async (args) => {
        return (await this.addText(args)) as any;
      }
    );

    this.server.registerTool(
      "add_image",
      {
        description: "Add an image object to a video project sequence",
        inputSchema: AddImageSchema,
      },
      async (args) => {
        return (await this.addImage(args)) as any;
      }
    );

    // disable in MCP for now
    // this.server.registerTool(
    //   "add_video",
    //   {
    //     description: "Add a video object to a video project sequence",
    //     inputSchema: AddVideoSchema,
    //   },
    //   async (args) => {
    //     return await this.addVideo(args) as any;
    //   }
    // );

    this.server.registerTool(
      "get_project_info",
      {
        description:
          "Get information about a video project including sequences and objects",
        inputSchema: GetProjectInfoSchema,
      },
      async (args) => {
        return (await this.getProjectInfo(args)) as any;
      }
    );

    this.server.registerTool(
      "create_sequence",
      {
        description: "Create a new sequence in a video project",
        inputSchema: CreateSequenceSchema,
      },
      async (args) => {
        return (await this.createSequence(args)) as any;
      }
    );

    this.server.registerTool(
      "list_user_projects",
      {
        description: "List all projects for a specific user",
        inputSchema: ListUserProjectsSchema,
      },
      async (args) => {
        return (await this.listUserProjects(args)) as any;
      }
    );

    this.server.registerTool(
      "get_project_by_name",
      {
        description: "Find a project by name for a specific user",
        inputSchema: GetProjectByNameSchema,
      },
      async (args) => {
        return (await this.getProjectByName(args)) as any;
      }
    );

    this.server.registerTool(
      "add_keyframes",
      {
        description: "Add keyframes for a specific property of an object",
        inputSchema: AddKeyframesSchema,
      },
      async (args) => {
        return (await this.addKeyframes(args)) as any;
      }
    );

    this.server.registerTool(
      "bulk_add_keyframes",
      {
        description:
          "Add keyframes in bulk for multiple objects and properties",
        inputSchema: BulkAddKeyframesSchema,
      },
      async (args) => {
        return (await this.bulkAddKeyframes(args)) as any;
      }
    );

    this.server.registerTool(
      "create_project",
      {
        description: "Create a new video project",
        inputSchema: CreateProjectSchema,
      },
      async (args) => {
        return (await this.createProject(args)) as any;
      }
    );
  }

  private async loadProject(projectId: string): Promise<SavedState> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      return project.fileData as unknown as SavedState;
    } catch (error) {
      throw new Error(
        `Failed to load project: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async saveProject(
    projectId: string,
    savedState: SavedState
  ): Promise<void> {
    try {
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          fileData: savedState as any,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to save project: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private findSequence(
    savedState: SavedState,
    sequenceId: string
  ): Sequence | null {
    return savedState.sequences.find((s) => s.id === sequenceId) || null;
  }

  private async addPolygon(params: any) {
    const savedState = await this.loadProject(params.projectId);
    const sequence = this.findSequence(savedState, params.sequenceId);

    if (!sequence) {
      throw new Error(`Sequence with ID ${params.sequenceId} not found`);
    }

    const polygon: SavedPolygonConfig = {
      id: uuidv4(),
      name: params.name,
      backgroundFill: params.backgroundFill as BackgroundFill,
      dimensions: params.dimensions as [number, number],
      position: params.position,
      borderRadius: params.borderRadius,
      stroke: {
        thickness: 0,
        fill: [0, 0, 0, 0],
      },
      layer: params.layer,
      isCircle: params.isCircle,
    };

    sequence.activePolygons.push(polygon);
    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Added polygon "${params.name}" with ID ${polygon.id} to sequence ${params.sequenceId}`,
        },
      ],
    };
  }

  private async addText(params: any) {
    const savedState = await this.loadProject(params.projectId);
    const sequence = this.findSequence(savedState, params.sequenceId);

    if (!sequence) {
      throw new Error(`Sequence with ID ${params.sequenceId} not found`);
    }

    const textItem: SavedTextRendererConfig = {
      id: uuidv4(),
      name: params.name,
      text: params.text,
      fontFamily: params.fontFamily,
      fontSize: params.fontSize,
      dimensions: params.dimensions as [number, number],
      position: params.position,
      layer: params.layer,
      color: params.color as [number, number, number, number],
      backgroundFill: params.backgroundFill as BackgroundFill,
      isCircle: params.isCircle,
      textAnimation: null,
    };

    sequence.activeTextItems.push(textItem);
    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Added text "${params.name}" with ID ${textItem.id} to sequence ${params.sequenceId}`,
        },
      ],
    };
  }

  private async addImage(params: any) {
    const savedState = await this.loadProject(params.projectId);
    const sequence = this.findSequence(savedState, params.sequenceId);

    if (!sequence) {
      throw new Error(`Sequence with ID ${params.sequenceId} not found`);
    }

    // Use placeholder image if no URL provided or if URL is empty
    const imageUrl =
      params.url ||
      "https://via.placeholder.com/300x200/cccccc/666666?text=Placeholder";

    const imageItem: SavedStImageConfig = {
      id: uuidv4(),
      name: params.name,
      url: imageUrl,
      dimensions: params.dimensions as [number, number],
      position: params.position,
      layer: params.layer,
      isCircle: params.isCircle,
      isSticker: params.isSticker,
    };

    sequence.activeImageItems.push(imageItem);
    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Added image "${params.name}" with ID ${imageItem.id} to sequence ${params.sequenceId}`,
        },
      ],
    };
  }

  private async addVideo(params: any) {
    const savedState = await this.loadProject(params.projectId);
    const sequence = this.findSequence(savedState, params.sequenceId);

    if (!sequence) {
      throw new Error(`Sequence with ID ${params.sequenceId} not found`);
    }

    const videoItem: SavedStVideoConfig = {
      id: uuidv4(),
      name: params.name,
      path: params.path,
      dimensions: params.dimensions as [number, number],
      position: params.position,
      layer: params.layer,
    };

    sequence.activeVideoItems.push(videoItem);
    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Added video "${params.name}" with ID ${videoItem.id} to sequence ${params.sequenceId}`,
        },
      ],
    };
  }

  private async getProjectInfo(params: any) {
    const savedState = await this.loadProject(params.projectId);

    const info = {
      sequences: savedState.sequences.map((s) => ({
        id: s.id,
        name: s.name || "Unnamed",
        durationMs: s.durationMs || 0,
        objectCounts: {
          polygons: s.activePolygons.length,
          textItems: s.activeTextItems.length,
          imageItems: s.activeImageItems.length,
          videoItems: s.activeVideoItems.length,
        },
      })),
      settings: savedState.settings || null,
      timelineState: savedState.timeline_state || null,
    };

    return {
      content: [
        {
          type: "text",
          text: `Project Info:\n${JSON.stringify(info, null, 2)}`,
        },
      ],
    };
  }

  private async createSequence(params: any) {
    const savedState = await this.loadProject(params.projectId);

    const sequence: Sequence = {
      id: uuidv4(),
      name: params.name,
      durationMs: params.durationMs,
      backgroundFill: params.backgroundFill as BackgroundFill,
      activePolygons: [],
      activeTextItems: [],
      activeImageItems: [],
      activeVideoItems: [],
      polygonMotionPaths: [],
    };

    savedState.sequences.push(sequence);
    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Created sequence "${params.name}" with ID ${sequence.id}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Video Project MCP Server running on stdio");
  }

  private async listUserProjects(params: any) {
    try {
      const projects = await this.prisma.project.findMany({
        where: { ownerId: params.userId },
        select: {
          id: true,
          name: true,
          public: true,
          isTemplate: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${projects.length} projects:\n${JSON.stringify(
              projects,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to list projects: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getProjectByName(params: any) {
    try {
      const project = await this.prisma.project.findFirst({
        where: {
          ownerId: params.userId,
          name: params.projectName,
        },
        select: {
          id: true,
          name: true,
          public: true,
          isTemplate: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!project) {
        return {
          content: [
            {
              type: "text",
              text: `No project found with name "${params.projectName}" for user ${params.userId}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found project:\n${JSON.stringify(project, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to find project: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private createKeyframeValue(propertyName: string, value: any): KeyframeValue {
    const lowerProperty = propertyName.toLowerCase();

    if (lowerProperty === "position") {
      if (Array.isArray(value) && value.length === 2) {
        return { type: "Position", value: [value[0], value[1]] };
      }
      throw new Error("Position property requires [x, y] array");
    }

    if (lowerProperty === "rotation") {
      if (typeof value === "number") {
        return { type: "Rotation", value: value };
      }
      throw new Error("Rotation property requires a number value");
    }

    if (lowerProperty === "scalex") {
      if (typeof value === "number") {
        return { type: "ScaleX", value: value };
      }
      throw new Error("ScaleX property requires a number value");
    }

    if (lowerProperty === "scaley") {
      if (typeof value === "number") {
        return { type: "ScaleY", value: value };
      }
      throw new Error("ScaleY property requires a number value");
    }

    if (lowerProperty === "perspectivex") {
      if (typeof value === "number") {
        return { type: "PerspectiveX", value: value };
      }
      throw new Error("PerspectiveX property requires a number value");
    }

    if (lowerProperty === "perspectivey") {
      if (typeof value === "number") {
        return { type: "PerspectiveY", value: value };
      }
      throw new Error("PerspectiveY property requires a number value");
    }

    if (lowerProperty === "opacity") {
      if (typeof value === "number") {
        return { type: "Opacity", value: value };
      }
      throw new Error("Opacity property requires a number value");
    }

    throw new Error(`Unsupported property: ${propertyName}`);
  }

  private findOrCreateAnimationData(
    savedState: SavedState,
    sequenceId: string,
    objectId: string
  ): AnimationData {
    const sequence = this.findSequence(savedState, sequenceId);
    if (!sequence) {
      throw new Error(`Sequence with ID ${sequenceId} not found`);
    }

    if (!sequence.polygonMotionPaths) {
      sequence.polygonMotionPaths = [];
    }

    let animationData = sequence.polygonMotionPaths.find(
      (path) => path.polygonId === objectId
    );

    if (!animationData) {
      const objectType = this.determineObjectType(savedState, objectId);
      if (!objectType) {
        throw new Error(`Object with ID ${objectId} not found in sequence`);
      }

      animationData = {
        id: uuidv4(),
        objectType: objectType,
        polygonId: objectId,
        duration: 5000,
        startTimeMs: 0,
        properties: [],
        position: [0, 0],
      };

      sequence.polygonMotionPaths.push(animationData);
    }

    return animationData;
  }

  private determineObjectType(
    savedState: SavedState,
    objectId: string
  ): ObjectType | null {
    for (const sequence of savedState.sequences) {
      if (sequence.activePolygons.some((p) => p.id === objectId)) {
        return ObjectType.Polygon;
      }
      if (sequence.activeTextItems.some((t) => t.id === objectId)) {
        return ObjectType.TextItem;
      }
      if (sequence.activeImageItems.some((i) => i.id === objectId)) {
        return ObjectType.ImageItem;
      }
      if (sequence.activeVideoItems.some((v) => v.id === objectId)) {
        return ObjectType.VideoItem;
      }
    }
    return null;
  }

  private findOrCreateAnimationProperty(
    animationData: AnimationData,
    propertyName: string
  ): AnimationProperty {
    let property = animationData.properties.find(
      (p) => p.name === propertyName
    );

    if (!property) {
      property = {
        name: propertyName,
        propertyPath: propertyName,
        children: [],
        keyframes: [],
        depth: 0,
      };
      animationData.properties.push(property);
    }

    return property;
  }

  private async addKeyframes(params: any) {
    const savedState = await this.loadProject(params.projectId);
    const animationData = this.findOrCreateAnimationData(
      savedState,
      params.sequenceId,
      params.objectId
    );
    const property = this.findOrCreateAnimationProperty(
      animationData,
      params.propertyName
    );

    let addedCount = 0;

    for (const keyframeData of params.keyframes) {
      const keyframeValue = this.createKeyframeValue(
        params.propertyName,
        keyframeData.value
      );

      const keyframe: UIKeyframe = {
        id: uuidv4(),
        time: keyframeData.time,
        value: keyframeValue,
        easing: keyframeData.easing as EasingType,
        pathType: keyframeData.pathType as PathType,
        curveData: null,
        keyType: { type: "Frame" },
      };

      property.keyframes.push(keyframe);
      addedCount++;
    }

    property.keyframes.sort((a, b) => a.time - b.time);

    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Added ${addedCount} keyframes for property "${params.propertyName}" on object ${params.objectId}`,
        },
      ],
    };
  }

  private async bulkAddKeyframes(params: any) {
    const savedState = await this.loadProject(params.projectId);
    let totalAddedCount = 0;
    const results: string[] = [];

    for (const keyframeDataGroup of params.keyframeData) {
      const animationData = this.findOrCreateAnimationData(
        savedState,
        params.sequenceId,
        keyframeDataGroup.objectId
      );
      const property = this.findOrCreateAnimationProperty(
        animationData,
        keyframeDataGroup.propertyName
      );

      let addedCount = 0;

      for (const keyframeData of keyframeDataGroup.keyframes) {
        const keyframeValue = this.createKeyframeValue(
          keyframeDataGroup.propertyName,
          keyframeData.value
        );

        const keyframe: UIKeyframe = {
          id: uuidv4(),
          time: keyframeData.time,
          value: keyframeValue,
          easing: keyframeData.easing as EasingType,
          pathType: keyframeData.pathType as PathType,
          curveData: null,
          keyType: { type: "Frame" },
        };

        property.keyframes.push(keyframe);
        addedCount++;
        totalAddedCount++;
      }

      property.keyframes.sort((a, b) => a.time - b.time);
      results.push(
        `Added ${addedCount} keyframes for property "${keyframeDataGroup.propertyName}" on object ${keyframeDataGroup.objectId}`
      );
    }

    await this.saveProject(params.projectId, savedState);

    return {
      content: [
        {
          type: "text",
          text: `Bulk keyframe operation completed. Total: ${totalAddedCount} keyframes added.\n${results.join(
            "\n"
          )}`,
        },
      ],
    };
  }

  private async createProject(params: any) {
    try {
      const defaultSavedState: SavedState = {
        sequences: [],
        settings: {
          dimensions: {
            width: 500,
            height: 900,
          },
        },
        timeline_state: null,
      };

      const project = await this.prisma.project.create({
        data: {
          id: uuidv4(),
          name: params.name,
          ownerId: params.userId,
          public: params.public,
          isTemplate: params.isTemplate,
          isFeatured: params.isFeatured,
          fileData: defaultSavedState as any,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `Created project "${params.name}" with ID ${project.id}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to create project: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

const server = new VideoProjectMCPServer();

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  await server.cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await server.cleanup();
  process.exit(0);
});

server.run().catch(console.error);
