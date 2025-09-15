import { z } from "zod";

export interface DataInterface {
  bulletPoints: {
    dataPoint: string;
    description: string;
  }[];
}

export const dataSchema = z.object({
  bulletPoints: z.array(
    z.object({
      dataPoint: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
      description: z
        .string()
        .describe("The text summarizing this bullet point."),
    })
  ),
});

export interface QuestionInterface {
  questions: {
    question: string;
    possibleAnswers: {
      answerText: string;
    }[];
  }[];
}

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
      possibleAnswers: z.array(
        z.object({
          answerText: z
            .string()
            .describe(
              "The qualitative or quantitative data point if one exists."
            ),
        })
      ),
    })
  ),
});

export interface ContentInterface {
  contentItems: {
    summaryText: string;
  }[];
}

export const contentSchema = z.object({
  contentItems: z.array(
    z.object({
      summaryText: z
        .string()
        .describe("The qualitative or quantitative data point if one exists."),
    })
  ),
});

export interface AnimationInterface {
  animations: {
    objectId: string;
    properties: {
      propertyName: string;
      keyframes: {
        time: number;
        value: number | [number, number];
        easing: string;
      }[];
    }[];
    description: string;
  }[];
  duration: number;
  style: string;
}

export const animationSchema = z.object({
  duration: z.number().describe("Total animation duration in milliseconds"),
  style: z
    .string()
    .describe(
      "Animation style: 'smooth', 'bouncy', 'quick', 'dramatic', 'subtle'"
    ),
  animations: z.array(
    z.object({
      objectId: z
        .string()
        .describe(
          "The ID of the object to animate (e.g., 'text-1', 'polygon-2')"
        ),
      properties: z.array(
        z.object({
          propertyName: z
            .string()
            .describe(
              "The property to animate: 'Position', 'ScaleX', 'ScaleY', 'Rotation', 'Opacity'"
            ),
          keyframes: z.array(
            z.object({
              time: z
                .number()
                .describe("Time in milliseconds when this keyframe occurs"),
              value: z
                .union([z.number(), z.array(z.number()).length(2)])
                .describe(
                  "Value at this keyframe. Use [x, y] for position, single number for others. Scale/opacity: 0-100+"
                ),
              easing: z
                .string()
                .describe(
                  "Easing type: 'Linear', 'EaseIn', 'EaseOut', 'EaseInOut'"
                ),
            })
          ),
        })
      ),
      description: z
        .string()
        .describe("Brief description of what this animation does"),
    })
  ),
});

// Enum for object types that can be animated
const ObjectTypeSchema = z.enum(
  ["Polygon", "TextItem", "ImageItem", "VideoItem"],
  {
    description:
      "The type of object being animated (polygon, text, image, or video)",
  }
);

// Enum for easing types used in keyframe interpolation
const EasingTypeSchema = z.enum(["Linear", "EaseIn", "EaseOut", "EaseInOut"], {
  description:
    "The easing function type for smooth transitions between keyframes",
});

// Control point for bezier curves
const ControlPointSchema = z.object({
  x: z.number().int().describe("X coordinate of the control point"),
  y: z.number().int().describe("Y coordinate of the control point"),
});

// Curve data for bezier path types
const CurveDataSchema = z.object({
  control_point1: ControlPointSchema.optional().describe(
    "First control point for bezier curve"
  ),
  control_point2: ControlPointSchema.optional().describe(
    "Second control point for bezier curve"
  ),
});

// Path types for animation interpolation
const PathTypeSchema = z.union(
  [
    z.literal("Linear").describe("Linear interpolation between keyframes"),
    z.object({
      Bezier: CurveDataSchema.describe(
        "Bezier curve interpolation with control points"
      ),
    }),
  ],
  {
    description: "The type of path interpolation between keyframes",
  }
);

// Range data for range-type keyframes
const RangeDataSchema = z.object({
  end_time: z.number().int().describe("End time of the range in milliseconds"),
});

// Key types for different keyframe behaviors
const KeyTypeSchema = z.union(
  [
    z.literal("Frame").describe("Single frame keyframe"),
    z.object({
      Range: RangeDataSchema.describe("Range keyframe with duration"),
    }),
  ],
  {
    description:
      "The type of keyframe - either a single frame or a range with duration",
  }
);

//ossible values that can be animated
const KeyframeValueSchema = z.union(
  [
    z.object({
      // Position: z
      //   .tuple([z.number().int(), z.number().int()])
      //   .describe("2D position coordinates [x, y]"),
      Position: z
        .object({
          x: z.number().int().describe("X coordinate"),
          y: z.number().int().describe("Y coordinate"),
        })
        .describe("2D position coordinates"),
    }),
    z.object({
      Rotation: z.number().int().describe("Rotation value in degrees"),
    }),
    z.object({
      Scale: z.number().int().describe("Scale value (100 = default size)"),
    }),
    // z.object({
    //   PerspectiveX: z
    //     .number()
    //     .int()
    //     .describe("X-axis perspective transformation"),
    // }),
    // z.object({
    //   PerspectiveY: z
    //     .number()
    //     .int()
    //     .describe("Y-axis perspective transformation"),
    // }),
    z.object({
      Opacity: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe("Opacity value (0-100)"),
    }),
    // z.object({
    //   Zoom: z
    //     .number()
    //     .int()
    //     .min(100)
    //     .describe("Zoom level (100 = minimum zoom)"),
    // }),
    // z.object({
    //   Custom: z.array(z.number().int()).describe("Custom animation values"),
    // }),
  ],
  {
    description:
      "The animated value at this keyframe (position, rotation, scale, etc.)",
  }
);

// Individual keyframe in the animation timeline
const UIKeyframeSchema = z.object({
  // id: z.string().describe("Unique identifier for this specific keyframe"),
  time: z.number().int().describe("Time of the keyframe in milliseconds"),
  value: KeyframeValueSchema.describe("The animated value at this keyframe"),
  easing: EasingTypeSchema.describe(
    "Easing function for interpolation to the next keyframe"
  ),
  // path_type: PathTypeSchema.describe(
  //   "Whether to use linear or bezier curve interpolation"
  // ),
  // key_type: KeyTypeSchema.describe("Type of keyframe (single frame or range)"),
});

// Animation property that can be animated in the UI
const AnimationPropertySchema: z.ZodType<{
  name: string;
  // property_path: string;
  // children: any[];
  keyframes: z.infer<typeof UIKeyframeSchema>[];
  // depth: number;
}> = z.object({
  name: z
    .string()
    .describe('Display name of the property (e.g., "Position", "Scale")'),
  // property_path: z
  //   .string()
  //   .describe(
  //     "Path to this property in the data structure for linking to motion path data (ex. Scale, Position) similar to name"
  //   ),
  // children: z
  //   .array(z.lazy(() => AnimationPropertySchema))
  //   .describe("Nested child properties for hierarchical organization"),
  keyframes: z
    .array(UIKeyframeSchema)
    .describe("Keyframes that define the animation timeline for this property"),
  // depth: z
  //   .number()
  //   .int()
  //   .min(0)
  //   .describe("Visual depth level in the property tree hierarchy"),
});

// Main animation data structure
export const AnimationDataSchema = z.object({
  id: z.string().describe("Unique identifier for this animation"),
  // object_type: ObjectTypeSchema.describe(
  //   "Type of object being animated (polygon, text, image, or video)"
  // ),
  // polygon_id: z
  //   .string()
  //   .describe("Unique identifier of the associated polygon or object"),
  duration: z
    .number()
    .int()
    .describe("Total duration of the animation in milliseconds"),
  // start_time_ms: z
  //   .number()
  //   .int()
  //   .describe("Start time of the animation within the sequence (milliseconds)"),
  properties: z
    .array(AnimationPropertySchema)
    .describe(
      "Hierarchical list of animatable properties with their keyframes"
    ),
  // position: z
  //   .tuple([z.number().int(), z.number().int()])
  //   .describe("Relative position coordinates [x, y] of the animated object"),
});
