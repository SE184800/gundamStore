export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function normalizeProductMedia(media = {}) {
  return {
    card: media.card || "",
    home: media.home || "",
    detailMain: media.detailMain || "",
    gallery: Array.isArray(media.gallery) ? media.gallery.filter(Boolean) : [],
    hover: media.hover || "",
    box: media.box || "",
  };
}
