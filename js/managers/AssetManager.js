// AssetManager.js
export class AssetManager {
    constructor() {
        this.images = {};
    }

    async loadImage(key, path, removeBlackBackground = false) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                if (removeBlackBackground) {
                    // Process image to replace black with transparent
                    const processedImg = this.removeColorFromImage(img, 0, 0, 0);
                    this.images[key] = processedImg;
                    resolve(processedImg);
                } else {
                    this.images[key] = img;
                    resolve(img);
                }
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }

    // DRY function to process pixel data
    removeColorFromImage(image, r, g, b) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        // willReadFrequently optimizes memory for getImageData operations
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Loop through all pixels (4 values per pixel: R, G, B, Alpha)
        for (let i = 0; i < data.length; i += 4) {
            // If the pixel matches the target color exactly
            if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
                data[i + 3] = 0; // Set Alpha to 0 (Transparent)
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create a new image from the processed canvas
        const newImage = new Image();
        newImage.src = canvas.toDataURL('image/png');
        return newImage;
    }

    getImage(key) {
        return this.images[key];
    }
}