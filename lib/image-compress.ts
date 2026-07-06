/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Resizes the image to fit within maxWidth/maxHeight and exports as WebP.
 */
export function compressImage(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio to fit within boundaries
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas to a WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create a new file with webp extension
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newName = `${originalName}.webp`;
            const compressedFile = new File([blob], newName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
