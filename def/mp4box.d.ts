declare module "mp4box" {
  export interface MP4MediaTrack {
    id: number;
    created: Date;
    modified: Date;
    movie_duration: number;
    movie_timescale: number;
    layer: number;
    alternate_group: number;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    nb_samples: number;
  }

  export interface MP4VideoData {
    width: number;
    height: number;
  }

  export interface MP4VideoTrack extends MP4MediaTrack {
    video: MP4VideoData;
  }

  export interface MP4AudioData {
    sample_rate: number;
    channel_count: number;
    sample_size: number;
  }

  export interface MP4AudioTrack extends MP4MediaTrack {
    audio: MP4AudioData;
  }

  export type MP4Track = MP4VideoTrack | MP4AudioTrack;

  export interface MP4Info {
    duration: number;
    timescale: number;
    fragment_duration: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
    audioTracks: MP4AudioTrack[];
    videoTracks: MP4VideoTrack[];
  }

  export interface MP4Sample {
    alreadyRead: number;
    chunk_index: number;
    chunk_run_index: number;
    cts: number;
    data: Uint8Array;
    degradation_priority: number;
    depends_on: number;
    description: any;
    description_index: number;
    dts: number;
    duration: number;
    has_redundancy: number;
    is_depended_on: number;
    is_leading: number;
    is_sync: boolean;
    number: number;
    offset: number;
    size: number;
    timescale: number;
    track_id: number;
  }

  export type MP4ArrayBuffer = ArrayBuffer & { fileStart: number };

  export class DataStream {
    static BIG_ENDIAN: boolean;
    static LITTLE_ENDIAN: boolean;
    buffer: ArrayBuffer;
    constructor(
      arrayBuffer?: ArrayBuffer,
      byteOffset: number,
      endianness: boolean
    ): void;
    // TODO: Complete interface
  }

  export interface Trak {
    mdia?: {
      minf?: {
        stbl?: {
          stsd?: {
            entries: {
              avcC?: {
                write: (stream: DataStream) => void;
              };
              hvcC?: {
                write: (stream: DataStream) => void;
              };
            }[];
          };
        };
      };
    };
    // TODO: Complete interface
  }

  export interface TrackOptions {
    id?: number;
    type?: string;
    width?: number;
    height?: number;
    duration?: number;
    layer?: number;
    timescale?: number;
    media_duration?: number;
    language?: string;
    hdlr?: string;

    // video
    avcDecoderConfigRecord?: any;
    hevcDecoderConfigRecord?: any;

    // audio
    balance?: number;
    channel_count?: number;
    samplesize?: number;
    samplerate?: number;

    // captions
    namespace?: string;
    schema_location?: string;
    auxiliary_mime_types?: string;

    description?: BoxParser.Box;
    description_boxes?: BoxParser.Box[];

    default_sample_description_index_id?: number;
    default_sample_duration?: number;
    default_sample_size?: number;
    default_sample_flags?: number;
  }

  export interface SampleOptions {
    sample_description_index?: number;
    duration?: number;
    cts?: number;
    dts?: number;
    is_sync?: boolean;
    is_leading?: number;
    depends_on?: number;
    is_depended_on?: number;
    has_redundancy?: number;
    degradation_priority?: number;
    subsamples?: any;
  }

  export interface MP4File {
    onMoovStart?: () => void;
    onReady?: (info: MP4Info) => void;
    onError?: (e: string) => void;
    onSamples?: (id: number, user: any, samples: MP4Sample[]) => any;

    appendBuffer(data: MP4ArrayBuffer): number;
    start(): void;
    stop(): void;
    flush(): void;
    releaseUsedSamples(trackId: number, sampleNumber: number): void;
    setExtractionOptions(
      trackId: number,
      user?: any,
      options?: { nbSamples?: number; rapAlignment?: number }
    ): void;
    getTrackById(trackId: number): Trak;

    addTrack(options?: TrackOptions): number;
    addSample(
      track: number,
      data: ArrayBuffer,
      options?: SampleOptions
    ): MP4Sample;
  }

  export function createFile(): MP4File;

  export {};
}
