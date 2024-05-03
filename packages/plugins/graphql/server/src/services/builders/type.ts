import { isArray, isString, isUndefined, constant } from 'lodash/fp';
import { objectType } from 'nexus';
import { contentTypes } from '@strapi/utils';
import type { Schema } from '@strapi/types';
import type { Context } from '../types';
import { blocks } from 'nexus';
import { CacheHint } from 'apollo-server-types';

export type TypeBuildersOptions<TypeName extends string = string> = {
  builder: Omit<blocks.OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'>;
  attributeName: string;
  attribute: any;
  contentType: any;
  context: Context;
  cacheHint?: CacheHint;
};

export default (context: Context) => {
  const { strapi } = context;
  const getGraphQLService = strapi.plugin('graphql').service;

  const extension = getGraphQLService('extension');

  /**
   * Add a scalar attribute to the type definition
   *
   * The attribute is added based on a simple association between a Strapi
   * type and a GraphQL type (the map is defined in `strapiTypeToGraphQLScalar`)
   */
  const addScalarAttribute = (options: TypeBuildersOptions) => {
    const { builder, attributeName, attribute, cacheHint } = options;

    const { mappers } = getGraphQLService('utils');

    const gqlType = mappers.strapiScalarToGraphQLScalar(attribute.type);

    builder.field(attributeName, {
      type: gqlType,
      resolve: (parent, _args, _context, info) => {
        if (cacheHint) info.cacheControl.setCacheHint(cacheHint);
        return parent[attributeName];
      },
    });
  };

  /**
   * Add a component attribute to the type definition
   *
   * The attribute is added by fetching the component's type
   * name and using it as the attribute's type
   */
  const addComponentAttribute = (options: TypeBuildersOptions) => {
    const { builder, attributeName, contentType, attribute, cacheHint } = options;

    let localBuilder = builder;

    const { naming } = getGraphQLService('utils');
    const { getContentTypeArgs } = getGraphQLService('builders').utils;
    const { buildComponentResolver } = getGraphQLService('builders').get('content-api');

    const type = naming.getComponentNameFromAttribute(attribute);

    if (attribute.repeatable) {
      localBuilder = localBuilder.list;
    }

    const targetComponent = strapi.getModel(attribute.component);

    const resolve = buildComponentResolver({
      contentTypeUID: contentType.uid,
      attributeName,
      strapi,
      cacheHint,
    });

    const args = getContentTypeArgs(targetComponent, { multiple: !!attribute.repeatable });

    localBuilder.field(attributeName, { type, resolve, args });
  };

  /**
   * Add a dynamic zone attribute to the type definition
   *
   * The attribute is added by fetching the dynamic zone's
   * type name and using it as the attribute's type
   */
  const addDynamicZoneAttribute = (options: TypeBuildersOptions) => {
    const { builder, attributeName, contentType, cacheHint } = options;

    const { naming } = getGraphQLService('utils');
    const { ERROR_CODES } = getGraphQLService('constants');
    const { buildDynamicZoneResolver } = getGraphQLService('builders').get('content-api');

    const { components } = contentType.attributes[attributeName];

    const isEmpty = components.length === 0;
    const type = naming.getDynamicZoneName(contentType, attributeName);

    const resolve = isEmpty
      ? // If the dynamic zone don't have any component, then return an error payload
        constant({
          code: ERROR_CODES.emptyDynamicZone,
          message: `This dynamic zone don't have any component attached to it`,
        })
      : //  Else, return a classic dynamic-zone resolver
        buildDynamicZoneResolver({
          contentTypeUID: contentType.uid,
          attributeName,
          cacheHint,
        });

    builder.list.field(attributeName, { type, resolve });
  };

  /**
   * Add an enum attribute to the type definition
   *
   * The attribute is added by fetching the enum's type
   * name and using it as the attribute's type
   */
  const addEnumAttribute = (options: TypeBuildersOptions) => {
    const { builder, attributeName, contentType, cacheHint } = options;

    const { naming } = getGraphQLService('utils');

    const type = naming.getEnumName(contentType, attributeName);

    builder.field(attributeName, {
      type,
      resolve: (parent, _args, _context, info) => {
        if (cacheHint) info.cacheControl.setCacheHint(cacheHint);
        return parent[attributeName];
      },
    });
  };

  /**
   * Add a media attribute to the type definition
   */
  const addMediaAttribute = (options: TypeBuildersOptions) => {
    const { naming } = getGraphQLService('utils');
    const { getContentTypeArgs } = getGraphQLService('builders').utils;
    const { buildAssociationResolver } = getGraphQLService('builders').get('content-api');
    const extension = getGraphQLService('extension');

    const { builder } = options;
    const { attributeName, attribute, contentType, cacheHint } = options;
    const fileUID = 'plugin::upload.file';

    if (extension.shadowCRUD(fileUID).isDisabled()) {
      return;
    }

    const fileContentType = strapi.contentTypes[fileUID];

    const resolve = buildAssociationResolver({
      contentTypeUID: contentType.uid,
      attributeName,
      strapi,
      cacheHint,
    });

    const args = attribute.multiple ? getContentTypeArgs(fileContentType) : undefined;
    const type = attribute.multiple
      ? naming.getRelationResponseCollectionName(fileContentType)
      : naming.getEntityResponseName(fileContentType);

    builder.field(attributeName, { type, resolve, args });
  };

  /**
   * Add a polymorphic relational attribute to the type definition
   */
  const addPolymorphicRelationalAttribute = (options: TypeBuildersOptions) => {
    const { GENERIC_MORPH_TYPENAME } = getGraphQLService('constants');
    const { naming } = getGraphQLService('utils');
    const { buildAssociationResolver } = getGraphQLService('builders').get('content-api');

    let { builder } = options;
    const { attributeName, attribute, contentType, cacheHint } = options;

    const { target } = attribute;
    const isToManyRelation = attribute.relation.endsWith('Many');

    if (isToManyRelation) {
      builder = builder.list;
    }
    // todo[v4]: How to handle polymorphic relation w/ entity response collection types?
    //  -> Currently return raw polymorphic entities

    const resolve = buildAssociationResolver({
      contentTypeUID: contentType.uid,
      attributeName,
      strapi,
      cacheHint,
    });

    // If there is no specific target specified, then use the GenericMorph type
    if (isUndefined(target)) {
      builder.field(attributeName, {
        type: GENERIC_MORPH_TYPENAME,
        resolve,
      });
    }

    // If the target is an array of string, resolve the associated morph type and use it
    else if (isArray(target) && target.every(isString)) {
      const type = naming.getMorphRelationTypeName(contentType, attributeName);

      builder.field(attributeName, { type, resolve });
    }
  };

  /**
   * Add a regular relational attribute to the type definition
   */
  const addRegularRelationalAttribute = (options: TypeBuildersOptions) => {
    const { naming } = getGraphQLService('utils');
    const { getContentTypeArgs } = getGraphQLService('builders').utils;
    const { buildAssociationResolver } = getGraphQLService('builders').get('content-api');
    const extension = getGraphQLService('extension');

    const { builder } = options;
    const { attributeName, attribute, contentType, cacheHint } = options;

    if (extension.shadowCRUD(attribute.target).isDisabled()) {
      return;
    }

    const isToManyRelation = attribute.relation.endsWith('Many');

    const resolve = buildAssociationResolver({
      contentTypeUID: contentType.uid,
      attributeName,
      strapi,
      cacheHint,
    });

    const targetContentType = strapi.getModel(attribute.target);

    const type = isToManyRelation
      ? naming.getRelationResponseCollectionName(targetContentType)
      : naming.getEntityResponseName(targetContentType);

    const args = isToManyRelation ? getContentTypeArgs(targetContentType) : undefined;

    const resolverPath = `${naming.getTypeName(contentType)}.${attributeName}`;
    const resolverScope = `${targetContentType.uid}.find`;

    extension.use({ resolversConfig: { [resolverPath]: { auth: { scope: [resolverScope] } } } });

    builder.field(attributeName, { type, resolve, args });
  };

  const isNotPrivate = (contentType: Schema.Any) => (attributeName: string) => {
    return !contentTypes.isPrivateAttribute(contentType, attributeName);
  };

  const isNotDisabled = (contentType: Schema.Any) => (attributeName: string) => {
    return extension.shadowCRUD(contentType.uid).field(attributeName).hasOutputEnabled();
  };

  return {
    /**
     * Create a type definition for a given content type
     * @param contentType - The content type used to created the definition
     * @return {NexusObjectTypeDef}
     */
    buildTypeDefinition(contentType: Schema.Any) {
      const utils = getGraphQLService('utils');

      const { getComponentName, getTypeName } = utils.naming;
      const {
        isStrapiScalar,
        isComponent,
        isDynamicZone,
        isEnumeration,
        isMedia,
        isMorphRelation,
        isRelation,
      } = utils.attributes;

      const { attributes, modelType } = contentType;

      const attributesKey = Object.keys(attributes);

      const name = (modelType === 'component' ? getComponentName : getTypeName).call(
        null,
        contentType
      ) as string;

      return objectType({
        name,

        definition(t) {
          if (modelType === 'component' && isNotDisabled(contentType)('id')) {
            t.nonNull.id('id');
          }

          /** Attributes
           *
           * Attributes can be of 7 different kind:
           * - Scalar
           * - Component
           * - Dynamic Zone
           * - Enum
           * - Media
           * - Polymorphic Relations
           * - Regular Relations
           *
           * Here, we iterate over each non-private attribute
           * and add it to the type definition based on its type
           */
          attributesKey
            // Ignore private attributes
            .filter(isNotPrivate(contentType))
            // Ignore disabled fields (from extension service)
            .filter(isNotDisabled(contentType))
            // Add each attribute to the type definition
            .forEach((attributeName) => {
              const attribute = attributes[attributeName];

              // TODO: For some reason this cannot be augmented as Schema.PluginOptions
              interface PluginOptions {
                graphql?: {
                  cacheHint?: CacheHint;
                };
              }

              // If CacheHint is 0/Public, Cache-Control header is not added at all
              const cacheHint = (attribute.pluginOptions as PluginOptions)?.graphql?.cacheHint;

              // We create a copy of the builder (t) to apply custom
              // rules only on the current attribute (eg: nonNull, list, ...)
              const builder = attribute.required ? t.nonNull : t;

              const options: TypeBuildersOptions = {
                builder,
                attributeName,
                attribute,
                contentType,
                context,
                cacheHint,
              };

              // Enums
              if (isEnumeration(attribute)) {
                addEnumAttribute(options);
              }

              // Scalars
              else if (isStrapiScalar(attribute)) {
                addScalarAttribute(options);
              }

              // Components
              else if (isComponent(attribute)) {
                addComponentAttribute(options);
              }

              // Dynamic Zones
              else if (isDynamicZone(attribute)) {
                addDynamicZoneAttribute(options);
              }

              // Media
              else if (isMedia(attribute)) {
                addMediaAttribute(options);
              }

              // Polymorphic Relations
              else if (isMorphRelation(attribute)) {
                addPolymorphicRelationalAttribute(options);
              }

              // Regular Relations
              else if (isRelation(attribute)) {
                addRegularRelationalAttribute(options);
              }
            });
        },
      });
    },
  };
};
