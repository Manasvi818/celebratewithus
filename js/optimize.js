function optimizeCloudinaryUrl(url, width = 500) {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  if (url.includes("/upload/f_auto")) return url; // avoid duplicate

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width}/`
  );
}