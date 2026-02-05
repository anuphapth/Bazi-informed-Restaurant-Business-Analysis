import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export const uploadToCloudinary = (
  buffer,
  folder = "menus"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        format: "webp",
        transformation: [
          { width: 1200, crop: "limit", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    ).end(buffer)
  })
}

export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId)
}

export const getPublicIdFromUrl = (url) => {
  try {
    const uploadIndex = url.indexOf("/upload/")
    if (uploadIndex === -1) return null

    let publicId = url.substring(uploadIndex + 8)
    publicId = publicId.replace(/^v\d+\//, "")
    publicId = publicId.replace(/\.[^/.]+$/, "")

    return publicId
  } catch (err) {
    console.error("Invalid Cloudinary URL:", url)
    return null
  }
}
