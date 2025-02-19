export class WebCapture {
  mediaRecorder: MediaRecorder | null = null;
  mediaStream: MediaStream | null = null;

  constructor() {}

  checkSupport() {
    const isSupported = MediaRecorder.isTypeSupported("video/mp4");

    return isSupported;
  }

  async startScreenCapture(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      //   return stream;
    } catch (error) {
      console.error("Error accessing screen capture:", error);
      //   return null;
    }
  }

  startRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaStream) {
        return;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: "video/mp4",
      });

      const chunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event: Event) => {
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.start();
    });
  }

  stopRecording(): void {
    if (!this.mediaRecorder) {
      return;
    }

    this.mediaRecorder.stop();
  }
}
