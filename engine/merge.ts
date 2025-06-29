import { v4 as uuidv4 } from "uuid";
import {
  SavedState,
  Sequence,
  ObjectType,
  AnimationData,
  BackgroundFill,
} from "./animations"; // Adjust import path as needed
import { SavedStImageConfig } from "./image";
import { SavedStVideoConfig } from "./video";
import { SavedPolygonConfig } from "./polygon";

interface MergeOptions {
  videoWidthThreshold?: number; // Default 200px
  preserveTemplateImages?: boolean; // Default true
  preserveTemplateVideos?: boolean; // Default true
}

/**
 * Merges a template with user-supplied content
 * - Retains all images from template
 * - Replaces polygons with user images/videos based on size
 * - Uses videos for polygons >= 200px wide, otherwise images
 */
export function mergeTemplateWithUserContent(
  currentSequenceId: string,
  existingTemplate: SavedState,
  userProject: SavedState,
  options: MergeOptions = {}
): SavedState {
  const {
    videoWidthThreshold = 200,
    preserveTemplateImages = true,
    preserveTemplateVideos = true,
  } = options;

  // Get user content pools
  const userImages = getUserImages(userProject);
  const userVideos = getUserVideos(userProject);

  let imageIndex = 0;
  let videoIndex = 0;

  // Process each sequence in the template
  // although only supporting single sequence for now
  const mergedSequences: Sequence[] = existingTemplate.sequences.map(
    (templateSequence, index) => {
      const mergedSequence: Sequence = {
        ...templateSequence,
        activePolygons: [], // Clear polygons as we're replacing them
        activeImageItems: preserveTemplateImages
          ? [...templateSequence.activeImageItems]
          : [],
        activeVideoItems: preserveTemplateVideos
          ? [...templateSequence.activeVideoItems]
          : [],
        polygonMotionPaths: [...(templateSequence.polygonMotionPaths || [])], // Start with existing motion paths
        // set id to existing sequence id to maintain reference in timeline
        id: currentSequenceId, // for single sequence support
      };

      // Keep track of motion paths that get transferred to new items
      const transferredMotionPaths: AnimationData[] = [];

      // Process each polygon in the template sequence
      templateSequence.activePolygons.forEach((polygon) => {
        const polygonWidth = getPolygonWidth(polygon);
        const shouldUseVideo = polygonWidth >= videoWidthThreshold;

        if (shouldUseVideo && userVideos.length > videoIndex) {
          // Replace polygon with user video
          const userVideo = userVideos[videoIndex];
          const convertedVideo = convertPolygonToVideo(polygon, userVideo);
          mergedSequence.activeVideoItems.push(convertedVideo);

          // Transfer any motion paths
          const motionPath = findMotionPathForPolygon(
            templateSequence,
            polygon.id
          );
          if (motionPath) {
            const updatedMotionPath = updateMotionPathForNewItem(
              motionPath,
              convertedVideo.id,
              ObjectType.VideoItem
            );
            transferredMotionPaths.push(updatedMotionPath);
          }

          videoIndex++;
        } else if (userImages.length > imageIndex) {
          // Replace polygon with user image (fallback or when width < threshold)
          const userImage = userImages[imageIndex];
          const convertedImage = convertPolygonToImage(polygon, userImage);
          mergedSequence.activeImageItems.push(convertedImage);

          // Transfer any motion paths
          const motionPath = findMotionPathForPolygon(
            templateSequence,
            polygon.id
          );
          if (motionPath) {
            const updatedMotionPath = updateMotionPathForNewItem(
              motionPath,
              convertedImage.id,
              ObjectType.ImageItem
            );
            transferredMotionPaths.push(updatedMotionPath);
          }

          imageIndex++;
        }
        // If no user content available, polygon is simply removed (not replaced)
      });

      // Remove original polygon motion paths and add the transferred ones
      const polygonIds = templateSequence.activePolygons.map((p) => p.id);
      mergedSequence.polygonMotionPaths = [
        // Keep motion paths that don't belong to replaced polygons
        ...(mergedSequence.polygonMotionPaths?.filter(
          (path) => !polygonIds.includes(path.polygonId)
        ) || []),
        // Add the transferred motion paths for new items
        ...transferredMotionPaths,
      ];

      return mergedSequence;
    }
  );

  return {
    ...existingTemplate,
    sequences: mergedSequences,
    timeline_state: userProject.timeline_state,
  };
}

/**
 * Extract all images from user project across all sequences
 */
function getUserImages(userProject: SavedState): SavedStImageConfig[] {
  return userProject.sequences.flatMap(
    (sequence) => sequence.activeImageItems || []
  );
}

/**
 * Extract all videos from user project across all sequences
 */
function getUserVideos(userProject: SavedState): SavedStVideoConfig[] {
  return userProject.sequences.flatMap(
    (sequence) => sequence.activeVideoItems || []
  );
}

/**
 * Calculate polygon width from its configuration
 */
function getPolygonWidth(polygon: SavedPolygonConfig): number {
  return polygon.dimensions[0]; // width is first element of dimensions array
}

/**
 * Convert polygon configuration to image configuration
 */
function convertPolygonToImage(
  polygon: SavedPolygonConfig,
  userImage: SavedStImageConfig
): SavedStImageConfig {
  return {
    ...userImage,
    id: uuidv4(),
    // Transfer position and dimensions from polygon
    position: polygon.position,
    dimensions: polygon.dimensions,
    layer: polygon.layer,
    isCircle: polygon.isCircle,
    // Keep the user's image URL and name
    name: userImage.name || `Image_${polygon.name}`,
    url: userImage.url,
  };
}

/**
 * Convert polygon configuration to video configuration
 */
function convertPolygonToVideo(
  polygon: SavedPolygonConfig,
  userVideo: SavedStVideoConfig
): SavedStVideoConfig {
  return {
    ...userVideo,
    id: uuidv4(),
    // Transfer position and dimensions from polygon
    position: polygon.position,
    dimensions: polygon.dimensions,
    layer: polygon.layer,
    // Keep the user's video path and name
    name: userVideo.name || `Video_${polygon.name}`,
    path: userVideo.path,
  };
}

/**
 * Find motion path animation for a specific polygon
 */
function findMotionPathForPolygon(
  sequence: Sequence,
  polygonId: string
): AnimationData | undefined {
  return sequence.polygonMotionPaths?.find(
    (path) => path.polygonId === polygonId
  );
}

/**
 * Update motion path to reference new item instead of polygon
 */
function updateMotionPathForNewItem(
  motionPath: AnimationData,
  newItemId: string,
  newObjectType: ObjectType
): AnimationData {
  return {
    ...motionPath,
    id: uuidv4(),
    polygonId: newItemId, // Reuse this field for the new item ID
    objectType: newObjectType,
  };
}

// Usage example:
/*
const mergedProject = mergeTemplateWithUserContent(
  existingTemplate,
  userProject,
  {
    videoWidthThreshold: 200,
    preserveTemplateImages: true,
    preserveTemplateVideos: true
  }
);
*/
