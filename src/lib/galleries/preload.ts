export type PreloadResult =
  | { status: 'success'; image: HTMLImageElement }
  | { status: 'error'; error: unknown };

export function preloadImage(src: string): Promise<PreloadResult> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve({
      status: 'success',
      image: { src } as HTMLImageElement
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ status: 'success', image });
    image.onerror = (error) => resolve({ status: 'error', error });
    image.src = src;
  });
}
