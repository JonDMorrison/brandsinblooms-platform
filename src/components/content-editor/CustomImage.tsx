/**
 * Custom Image extension for Tiptap
 * Extends the default Image extension to support width and alignment attributes
 */

import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      // Inherit default Image attributes (src, alt, title)
      ...this.parent?.(),

      // Add width attribute for image sizing
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },

      // Add align attribute for image positioning
      align: {
        default: null,
        parseHTML: element => element.getAttribute('align'),
        renderHTML: attributes => {
          if (!attributes.align) {
            return {};
          }
          return {
            align: attributes.align,
          };
        },
      },
    };
  },
});
