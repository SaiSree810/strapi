import { Strapi } from '@strapi/strapi';
import { prop } from 'lodash/fp';
import { builder } from './pothosBuilder';

export default ({ strapi, registry }: { strapi: Strapi; registry: any }) => {
  const { naming } = strapi.plugin('graphql').service('utils');
  const { KINDS, GENERIC_MORPH_TYPENAME } = strapi.plugin('graphql').service('constants');
  const { ERROR_TYPE_NAME } = strapi.plugin('graphql').service('constants');

  const members = registry
    // Resolve every content-type or component
    .where(({ config }: any) => [KINDS.type, KINDS.component].includes(config.kind))
    // Only keep their name (the type's id)
    .map(prop('name'));

  return {
    buildGenericMorphDefinition() {
      return builder.unionType(GENERIC_MORPH_TYPENAME, {
        types: [...members, ERROR_TYPE_NAME],
        resolveType(obj) {
          const contentType = strapi.getModel(obj.__type);

          if (!contentType) {
            return null;
          }

          if (contentType.modelType === 'component') {
            return naming.getComponentName(contentType);
          }

          return naming.getTypeName(contentType);
        },
      });
    },
  };
};
