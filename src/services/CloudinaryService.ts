import axios from "axios";

const CLOUD_NAME = "dovqvkbtx";
const UPLOAD_PRESET = "plantcare";
// Nếu dùng upload signed thì bạn cần backend – nhưng unsigned là đủ cho app cá nhân.

class CloudinaryService {
  async uploadImage(uri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);

      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return res.data.secure_url; // URL ảnh trên Cloudinary
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }
}

export default new CloudinaryService();
