/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "use-brk-images-s3.s3.us-east-1.amazonaws.com",
      "i.imgur.com",
      "res.cloudinary.com",
      "usebrk-s3.s3.sa-east-1.amazonaws.com",
      "images.tcdn.com.br",
      "i.postimg.cc",
    ],
  },
};

export default nextConfig;
