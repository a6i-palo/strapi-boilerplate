import type { Schema, Attribute } from '@strapi/strapi';

export interface QuestionQuestion extends Schema.Component {
  collectionName: 'components_category_questions';
  info: {
    displayName: 'MCQ';
    icon: 'layer';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    multiselect: Attribute.Boolean;
    choice: Attribute.Component<'question.mcq-question-choice', true>;
    code: Attribute.String & Attribute.Required;
  };
}

export interface QuestionNumericSelectionQuestion extends Schema.Component {
  collectionName: 'components_category_numeric_selection_questions';
  info: {
    displayName: 'Numeric Selection';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    maxScale: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<10>;
    minScale: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<1>;
    code: Attribute.String & Attribute.Required;
    type: Attribute.Enumeration<['NUMERIC', 'STAR_RATING']> &
      Attribute.Required &
      Attribute.DefaultTo<'NUMERIC'>;
  };
}

export interface QuestionNestedNumericSelectionQuestion
  extends Schema.Component {
  collectionName: 'components_category_nested_numeric_selection_questions';
  info: {
    displayName: 'Numeric Selection Group';
    description: '';
  };
  attributes: {
    questionGroup: Attribute.Component<
      'question.numeric-selection-question',
      true
    >;
    title: Attribute.String;
    code: Attribute.String & Attribute.Required;
    type: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'NUMERIC_SELECTION_GROUP'>;
  };
}

export interface QuestionMcqQuestionChoice extends Schema.Component {
  collectionName: 'components_category_mcq_question_choices';
  info: {
    displayName: 'MCQ Choice';
    description: '';
  };
  attributes: {
    label: Attribute.String;
    code: Attribute.String & Attribute.Required;
  };
}

export interface QuestionFreeTextQuestion extends Schema.Component {
  collectionName: 'components_category_free_text_questions';
  info: {
    displayName: 'Free Text';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    code: Attribute.String & Attribute.Required;
    type: Attribute.Enumeration<['COMMENT_BOX']> &
      Attribute.Required &
      Attribute.DefaultTo<'COMMENT_BOX'>;
  };
}

export interface QuestionEvent extends Schema.Component {
  collectionName: 'components_question_events';
  info: {
    displayName: 'Event';
    description: '';
  };
  attributes: {
    description: Attribute.String;
    eventCode: Attribute.Enumeration<
      ['LOGIN', 'LOGOUT', 'EMEDICAL_CARD_DOWNLOAD']
    > &
      Attribute.Required;
  };
}

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
      'question.question': QuestionQuestion;
      'question.numeric-selection-question': QuestionNumericSelectionQuestion;
      'question.nested-numeric-selection-question': QuestionNestedNumericSelectionQuestion;
      'question.mcq-question-choice': QuestionMcqQuestionChoice;
      'question.free-text-question': QuestionFreeTextQuestion;
      'question.event': QuestionEvent;
      'category.text-snippet': CategoryTextSnippet;
      'category.long-text-snippet': CategoryLongTextSnippet;
      'category.image-snippet': CategoryImageSnippet;
    }
  }
}
