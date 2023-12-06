import { pick, getOr } from 'lodash/fp';
import { contentTypes as contentTypesUtils } from '@strapi/utils';

const dtoFields = [
  'uid',
  'isDisplayed',
  'apiID',
  'kind',
  'category',
  'info',
  'options',
  'pluginOptions',
  'attributes',
  'pluginOptions',
];

export default () => ({
  toContentManagerModel(contentType: any) {
    return {
      ...contentType,
      apiID: contentType.modelName,
      isDisplayed: isVisible(contentType),
      attributes: {
        id: {
          type: 'integer',
        },
        ...formatAttributes(contentType),
      },
    };
  },

  toDto: pick(dtoFields),
});

const formatAttributes = (contentType: any) => {
  const { getVisibleAttributes, getTimestamps, getCreatorFields } = contentTypesUtils;

  // only get attributes that can be seen in the auto generated Edit view or List view
  return getVisibleAttributes(contentType)
    .concat(getTimestamps(contentType))
    .concat(getCreatorFields(contentType))
    .reduce((acc: any, key: any) => {
      const attribute = contentType.attributes[key];

      // ignore morph until they are handled in the front
      if (attribute.type === 'relation' && attribute.relation.toLowerCase().includes('morph')) {
        return acc;
      }

      acc[key] = formatAttribute(key, attribute);
      return acc;
    }, {});
};

// FIXME: not needed
const formatAttribute = (key: any, attribute: any) => {
  if (attribute.type === 'relation') {
    return toRelation(attribute);
  }

  return attribute;
};

// FIXME: not needed
const toRelation = (attribute: any) => {
  return {
    ...attribute,
    type: 'relation',
    targetModel: attribute.target,
    relationType: attribute.relation,
  };
};

const isVisible = (model: any) =>
  getOr(true, 'pluginOptions.content-manager.visible', model) === true;
