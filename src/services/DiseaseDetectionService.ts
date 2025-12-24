import ImageService from './ImageService';
import type { DiagnosisResult } from '../types';

class DiseaseDetectionService {
  /**
   * Detect disease from plant image
   */
  async detectDisease(
    imageUri: string,
    opts?: { lite?: boolean },
  ): Promise<DiagnosisResult> {
    try {
      // Validate image first
      const isValid = await ImageService.validateImage(imageUri);
      if (!isValid) {
        throw new Error('Invalid image format');
      }

      // Process image for detection
      const processedImage = await ImageService.processImageForDetection(
        imageUri,
      );

      const formData = new FormData();

      formData.append('file', {
        uri: processedImage.uri,
        name: 'plant.jpg',
        type: 'image/jpeg',
      } as any);

      if (opts?.lite) {
        formData.append('lite', 'true');
      }

      const response = await fetch('http://192.168.0.111:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 429) {
        const ra = response.headers.get('Retry-After');
        const err: any = new Error('Rate limited');
        err.retryAfter = ra ? Number(ra) : 20;
        throw err;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed: ${response.status} ${text}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Disease detection error:', error);
      throw new Error('Failed to analyze the image. Please try again.');
    }
  }

  /**
   * Validate detection result
   */
  validateResult(result: any): result is DiagnosisResult {
    return (
      result &&
      typeof result.disease === 'string' &&
      typeof result.confidence === 'number' &&
      typeof result.treatment === 'string' &&
      typeof result.description === 'string' &&
      typeof result.severity === 'string' &&
      Array.isArray(result.recommendations)
    );
  }
}

export default new DiseaseDetectionService();
