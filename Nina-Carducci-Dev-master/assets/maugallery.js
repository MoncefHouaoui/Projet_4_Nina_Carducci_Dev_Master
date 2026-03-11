(function ($) {
  "use strict";

  $.fn.mauGallery = function (options) {
    const settings = $.extend(true, {}, $.fn.mauGallery.defaults, options);

    return this.each(function () {
      const $gallery = $(this);

      if ($gallery.data("mauGalleryInitialized")) {
        return;
      }

      $gallery.data("mauGalleryInitialized", true);

      const methods = $.fn.mauGallery.methods;
      const tagsCollection = [];

      methods.createRowWrapper($gallery);

      if (settings.lightBox) {
        methods.createLightBox($gallery, settings.lightboxId, settings.navigation);
      }

      $gallery.children(".gallery-item").each(function () {
        const $item = $(this);
        methods.prepareItem($item, $gallery, settings.columns);

        const tag = $item.data("gallery-tag");
        if (settings.showTags && typeof tag !== "undefined" && !tagsCollection.includes(tag)) {
          tagsCollection.push(tag);
        }
      });

      if (settings.showTags) {
        methods.showItemTags($gallery, settings.tagsPosition, tagsCollection);
      }

      methods.bindEvents($gallery, settings);
      $gallery.show();
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: "galleryLightbox",
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.methods = {
    createRowWrapper($gallery) {
      if (!$gallery.children(".gallery-items-row").length) {
        $gallery.append('<div class="gallery-items-row row"></div>');
      }
    },

    prepareItem($item, $gallery, columns) {
      if ($item.prop("tagName") === "IMG") {
        $item.addClass("img-fluid");
      }

      $item.appendTo($gallery.find(".gallery-items-row").first());

      if (!$item.parent().hasClass("item-column")) {
        $item.wrap(`<div class="${this.getColumnClasses(columns)}"></div>`);
      }
    },

    getColumnClasses(columns) {
      let columnClasses = "item-column mb-4";

      if (typeof columns === "number") {
        return `${columnClasses} col-${Math.ceil(12 / columns)}`;
      }

      if (typeof columns === "object" && columns !== null) {
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        return columnClasses;
      }

      return `${columnClasses} col-4`;
    },

    bindEvents($gallery, settings) {
      $gallery.off(".mauGallery");
      $(document).off(".mauGalleryGlobal");

      $gallery.on("click.mauGallery", ".gallery-item", function () {
        if (!settings.lightBox || this.tagName !== "IMG") {
          return;
        }
        $.fn.mauGallery.methods.openLightBox($gallery, $(this), settings.lightboxId);
      });

      $gallery.on("click.mauGallery", ".nav-link", function () {
        $.fn.mauGallery.methods.filterByTag($gallery, $(this));
      });

      $gallery.on("keydown.mauGallery", ".nav-link", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          $.fn.mauGallery.methods.filterByTag($gallery, $(this));
        }
      });

      $gallery.on("click.mauGallery", ".mg-prev", function (event) {
        event.preventDefault();
        event.stopPropagation();
        $.fn.mauGallery.methods.changeImage($gallery, settings.lightboxId, -1);
      });

      $gallery.on("click.mauGallery", ".mg-next", function (event) {
        event.preventDefault();
        event.stopPropagation();
        $.fn.mauGallery.methods.changeImage($gallery, settings.lightboxId, 1);
      });

      $gallery.on("click.mauGallery", ".gallery-lightbox-overlay", function () {
        $.fn.mauGallery.methods.closeLightBox($gallery, settings.lightboxId);
      });

      $gallery.on("click.mauGallery", ".gallery-lightbox-content", function (event) {
        event.stopPropagation();
      });

      $(document).on("keydown.mauGalleryGlobal", function (event) {
        const resolvedId = $.fn.mauGallery.methods.getLightboxId(settings.lightboxId);
        const $overlay = $gallery.find(`#${resolvedId}`);

        if (!$overlay.hasClass("is-open")) {
          return;
        }

        if (event.key === "Escape") {
          $.fn.mauGallery.methods.closeLightBox($gallery, settings.lightboxId);
        }

        if (event.key === "ArrowLeft") {
          $.fn.mauGallery.methods.changeImage($gallery, settings.lightboxId, -1);
        }

        if (event.key === "ArrowRight") {
          $.fn.mauGallery.methods.changeImage($gallery, settings.lightboxId, 1);
        }
      });
    },

    getLightboxId(lightboxId) {
      return lightboxId || "galleryLightbox";
    },

    getVisibleImages($gallery) {
      const activeTag = $gallery.find(".tags-bar .active-tag").data("images-toggle") || "all";
      let $images = $gallery.find(".item-column:visible .gallery-item");

      if (activeTag !== "all") {
        $images = $images.filter(function () {
          return $(this).data("gallery-tag") === activeTag;
        });
      }

      return $images;
    },

    openLightBox($gallery, $element, lightboxId) {
      const resolvedId = this.getLightboxId(lightboxId);
      const $overlay = $gallery.find(`#${resolvedId}`);
      const $lightboxImage = $overlay.find(".lightboxImage");
      const src = $element.attr("src");
      const alt = $element.attr("alt") || "Image agrandie de la galerie";

      $lightboxImage.attr({ src: src, alt: alt });
      $overlay.data("currentSrc", src);
      $overlay.addClass("is-open").attr("aria-hidden", "false");
      $("body").addClass("lightbox-open");
    },

    closeLightBox($gallery, lightboxId) {
      const resolvedId = this.getLightboxId(lightboxId);
      const $overlay = $gallery.find(`#${resolvedId}`);
      $overlay.removeClass("is-open").attr("aria-hidden", "true");
      $("body").removeClass("lightbox-open");
    },

    changeImage($gallery, lightboxId, direction) {
      const resolvedId = this.getLightboxId(lightboxId);
      const $overlay = $gallery.find(`#${resolvedId}`);
      const $lightboxImage = $overlay.find(".lightboxImage");
      const currentSrc = $overlay.data("currentSrc") || $lightboxImage.attr("src");
      const $images = this.getVisibleImages($gallery);

      if (!$images.length) {
        return;
      }

      let currentIndex = 0;
      $images.each(function (index) {
        if ($(this).attr("src") === currentSrc) {
          currentIndex = index;
          return false;
        }
      });

      let nextIndex = currentIndex + direction;
      if (nextIndex < 0) {
        nextIndex = $images.length - 1;
      }
      if (nextIndex >= $images.length) {
        nextIndex = 0;
      }

      const $nextImage = $images.eq(nextIndex);
      const nextSrc = $nextImage.attr("src");
      const nextAlt = $nextImage.attr("alt") || "Image agrandie de la galerie";

      $lightboxImage.attr({ src: nextSrc, alt: nextAlt });
      $overlay.data("currentSrc", nextSrc);
    },

    createLightBox($gallery, lightboxId, navigation) {
      const resolvedId = this.getLightboxId(lightboxId);

      if ($gallery.find(`#${resolvedId}`).length) {
        return;
      }

      const prevButton = navigation
        ? '<button type="button" class="mg-prev" aria-label="Image précédente">&lt;</button>'
        : "";
      const nextButton = navigation
        ? '<button type="button" class="mg-next" aria-label="Image suivante">&gt;</button>'
        : "";

      $gallery.append(`
        <div class="gallery-lightbox-overlay" id="${resolvedId}" aria-hidden="true">
          <div class="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label="Image agrandie">
            ${prevButton}
            <img class="lightboxImage" src="" alt="Image agrandie de la galerie" loading="eager" decoding="async">
            ${nextButton}
          </div>
        </div>
      `);
    },

    showItemTags($gallery, position, tags) {
      if ($gallery.children(".tags-bar").length) {
        return;
      }

      let tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all" tabindex="0" role="button">Tous</span></li>';
      $.each(tags, function (_, value) {
        tagItems += `<li class="nav-item"><span class="nav-link" data-images-toggle="${value}" tabindex="0" role="button">${value}</span></li>`;
      });

      const tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;
      if (position === "top") {
        $gallery.prepend(tagsRow);
      } else {
        $gallery.append(tagsRow);
      }
    },

    filterByTag($gallery, $tagElement) {
      if ($tagElement.hasClass("active-tag")) {
        return;
      }

      $gallery.find(".active-tag").removeClass("active active-tag");
      $tagElement.addClass("active active-tag");
      const tag = $tagElement.data("images-toggle");

      $gallery.find(".item-column").each(function () {
        const $column = $(this);
        const imageTag = $column.find(".gallery-item").first().data("gallery-tag");
        $column.toggle(tag === "all" || imageTag === tag);
      });
    }
  };
})(jQuery);