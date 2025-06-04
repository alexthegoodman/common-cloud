export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// add fbq to the window object if it doesn't exist in type definitions
declare global {
  interface Window {
    fbq: (
      command: string,
      eventName?: string,
      options?: Record<string, any>
    ) => void;
  }
}

export const pageview = () => {
  window.fbq("track", "PageView");
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
  window.fbq("track", name, options);
};
