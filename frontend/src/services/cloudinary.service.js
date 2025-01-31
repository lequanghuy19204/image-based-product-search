import { Cloudinary } from '@cloudinary/url-gen';

class CloudinaryService {
  constructor() {
    this.cloudinary = new Cloudinary({
      cloud: {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      },
      url: {
        secure: true
      }
    });

    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'products');

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || 'Không thể upload ảnh');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadMultipleImages(files, onProgress) {
    try {
      const uploadPromises = files.map((file, index) => {
        return this.uploadImage(file, (progress) => {
          if (onProgress) {
            onProgress(index, progress);
          }
        });
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  getImageUrl(publicId) {
    return this.cloudinary.image(publicId)
      .format('auto')
      .quality('auto')
      .toURL();
  }
}

export const cloudinaryService = new CloudinaryService(); 