import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0–1
  format?: 'JPEG' | 'PNG';
}

class ImageService {
  /**
   * Chuẩn hóa URI từ camera
   * Vision Camera trả về path = /storage/emulated/0/... (không có file://)
   */
  normalizeUri(uri: string): string {
    if (!uri) return '';
    return uri.startsWith('file://') ? uri : `file://${uri}`;
  }

  /**
   * Resize + nén ảnh để đưa vào mô hình ML
   */
  async processImageForDetection(
    imageUri: string,
    options: ImageProcessingOptions = {},
  ): Promise<{
    uri: string;
    base64?: string;
    size: number;
  }> {
    try {
      const {
        maxWidth = 1024,
        maxHeight = 1024,
        quality = 0.8,
        format = 'JPEG',
      } = options;

      const normalized = this.normalizeUri(imageUri);

      // Resize ảnh thật
      const resized = await ImageResizer.createResizedImage(
        normalized,
        maxWidth,
        maxHeight,
        format,
        quality * 100,
        0, // rotation
        undefined,
        false, // keep meta
        { mode: 'contain' },
      );

      const fileInfo = await RNFS.stat(resized.uri.replace('file://', ''));

      return {
        uri: resized.uri,
        size: fileInfo.size,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Convert ảnh sang base64
   */
  async imageToBase64(imageUri: string): Promise<string> {
    try {
      const normalized = this.normalizeUri(imageUri).replace('file://', '');
      return await RNFS.readFile(normalized, 'base64');
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Validate ảnh – KHÔNG kiểm tra extension vì camera không có .jpg
   * Chỉ kiểm tra xem file có tồn tại
   */
  async validateImage(imageUri: string): Promise<boolean> {
    try {
      const path = this.normalizeUri(imageUri).replace('file://', '');
      return await RNFS.exists(path);
    } catch {
      return false;
    }
  }

  /**
   * Lấy chiều rộng + chiều cao bằng cách đọc EXIF metadata
   */
  async getImageDimensions(
    imageUri: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const normalized = this.normalizeUri(imageUri);
      const exif = await ImageResizer.getExif(normalized);
      return {
        width: exif?.width ?? 0,
        height: exif?.height ?? 0,
      };
    } catch (error) {
      console.error('Get dimensions error:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Lưu file vào thư mục tạm
   */
  async saveToTemp(imageUri: string, filename?: string): Promise<string> {
    try {
      const normalized = this.normalizeUri(imageUri).replace('file://', '');

      const tempDir =
        Platform.OS === 'ios'
          ? RNFS.TemporaryDirectoryPath
          : RNFS.CachesDirectoryPath;

      const fileName = filename || `processed_${Date.now()}.jpg`;
      const destPath = `${tempDir}/${fileName}`;

      await RNFS.copyFile(normalized, destPath);

      return `file://${destPath}`;
    } catch (error) {
      console.error('Save to temp error:', error);
      throw new Error('Failed to save image to temporary directory');
    }
  }

  /**
   * Xoá file tạm
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir =
        Platform.OS === 'ios'
          ? RNFS.TemporaryDirectoryPath
          : RNFS.CachesDirectoryPath;

      const files = await RNFS.readDir(tempDir);
      const imageFiles = files.filter(file =>
        file.name.startsWith('processed_'),
      );

      for (const file of imageFiles) {
        await RNFS.unlink(file.path);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new ImageService();
