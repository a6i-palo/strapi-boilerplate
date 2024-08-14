import type { Schema, Attribute } from '@strapi/strapi';

export interface CategoryTextSnippet extends Schema.Component {
  collectionName: 'components_category_text_snippets';
  info: {
    displayName: 'Short Text Snippet';
    icon: 'pencil';
    description: '';
  };
  attributes: {
    shortText: Attribute.String & Attribute.Required;
  };
}

export interface CategoryLongTextSnippet extends Schema.Component {
  collectionName: 'components_category_long_text_snippets';
  info: {
    displayName: 'Long Text Snippet';
    icon: 'pencil';
    description: '';
  };
  attributes: {
    longText: Attribute.Text & Attribute.Required;
  };
}

export interface CategoryImageSnippet extends Schema.Component {
  collectionName: 'components_category_image_snippets';
  info: {
    displayName: 'Image Snippet';
    icon: 'picture';
    description: '';
  };
  attributes: {
    singleImage: Attribute.Media<'images'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'category.text-snippet': CategoryTextSnippet;
      'category.long-text-snippet': CategoryLongTextSnippet;
      'category.image-snippet': CategoryImageSnippet;
    }
  }
}
