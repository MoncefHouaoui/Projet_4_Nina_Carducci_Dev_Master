window.addEventListener("load", function () {
  if (typeof jQuery === "undefined" || typeof jQuery.fn.mauGallery === "undefined") {
    return;
  }

  const $gallery = jQuery(".gallery");

  if (!$gallery.length) {
    return;
  }

  $gallery.mauGallery({
    columns: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 3,
      xl: 3
    },
    lightBox: true,
    lightboxId: "galleryLightbox",
    showTags: true,
    tagsPosition: "top",
    navigation: true
  });
});