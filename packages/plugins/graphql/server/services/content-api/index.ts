import { StrapiCTX } from '../../types/strapi-ctx';

import { mergeSchemas, addResolversToSchema } from '@graphql-tools/schema';
import { pruneSchema } from '@graphql-tools/utils';
import { prop, startsWith } from 'lodash/fp';

import { wrapResolvers } from './wrap-resolvers';
import {
  registerSingleType,
  registerCollectionType,
  registerComponent,
  registerScalars,
  registerInternals,
  registerPolymorphicContentType,
  contentType,
} from './register-functions';
import { builder } from '../builders/pothosBuilder';
import { ContentType } from '../../types/schema';

const {
  registerEnumsDefinition,
  registerInputsDefinition,
  registerFiltersDefinition,
  registerDynamicZonesDefinition,
} = contentType;

export default ({ strapi }: StrapiCTX) => {
  const { service: getGraphQLService } = strapi.plugin('graphql');
  const { config } = strapi.plugin('graphql');

  const { KINDS, GENERIC_MORPH_TYPENAME } = getGraphQLService('constants');
  const extensionService = getGraphQLService('extension');

  // Type Registry
  let registry: any;
  // Builders Instances
  let builders: any;

  const buildSchema = () => {
    const isShadowCRUDEnabled = !!config('shadowCRUD');

    // Create a new empty type registry
    registry = getGraphQLService('type-registry').new();

    // Reset the builders instances associated to the
    // content-api, and link the new type registry
    builders = getGraphQLService('builders').new('content-api', registry);

    registerScalars({ registry, strapi });
    registerInternals({ registry, strapi });

    if (isShadowCRUDEnabled) {
      shadowCRUD();
    }

    // Build a merged schema from both Nexus types & SDL type definitions
    const [schema, extension] = buildMergedSchema({ registry });

    // Add the extension's resolvers to the final schema
    const schemaWithResolvers = addResolversToSchema({ schema, resolvers: extension.resolvers });

    // // Create a configuration object for the artifacts generation
    // const outputs = {
    //   schema: config('artifacts.schema', false),
    //   typegen: config('artifacts.typegen', false),
    // };

    // const currentEnv = strapi.config.get('environment');

    // Wrap resolvers if needed (auth, middlewares, policies...) as configured in the extension
    const wrappedNexusSchema = wrapResolvers({ schema: schemaWithResolvers, strapi, extension });

    // Prune schema, remove unused types
    // eg: removes registered subscriptions if they're disabled in the config)
    const prunedNexusSchema = pruneSchema(wrappedNexusSchema);

    return prunedNexusSchema;
  };

  const buildMergedSchema = ({ registry }: { registry: any }) => {
    // Here we extract types, plugins & typeDefs from a temporary generated
    // extension since there won't be any addition allowed after schemas generation
    const extension = extensionService.generate({ typeRegistry: registry });

    // Nexus schema built with user-defined & shadow CRUD auto generated Nexus types
    const schema = builder.toSchema();

    // Merge type definitions with the Nexus schema
    return [
      mergeSchemas({
        typeDefs: extension.typeDefs || [],
        // Give access to the shadowCRUD & nexus based types
        // Note: This is necessary so that types defined in SDL can reference types defined with Nexus
        schemas: [schema],
      }),
      extension,
    ];
  };

  const shadowCRUD = () => {
    const extensionService = getGraphQLService('extension');

    // Get every content type & component defined in Strapi
    const contentTypes = [
      ...Object.values((strapi as any).components),
      ...Object.values(strapi.contentTypes),
    ] as ContentType[];

    // Disable Shadow CRUD for admin content types
    contentTypes
      .map(prop('uid'))
      .filter(startsWith('admin::'))
      .forEach((uid) => extensionService.shadowCRUD(uid).disable());

    const contentTypesWithShadowCRUD = contentTypes.filter((ct) =>
      extensionService.shadowCRUD(ct.uid).isEnabled()
    );

    // Generate and register definitions for every content type
    registerAPITypes(contentTypesWithShadowCRUD as ContentType[]);

    // Generate and register polymorphic types' definitions
    registerMorphTypes(contentTypesWithShadowCRUD as ContentType[]);
  };

  /**
   * Register needed GraphQL types for every content type
   */
  const registerAPITypes = (contentTypes: ContentType[]) => {
    for (const contentType of contentTypes) {
      const { kind, modelType } = contentType;

      const registerOptions = { registry, strapi, builders };

      // Generate various types associated to the content type
      // (enums, dynamic-zones, filters, inputs...)
      registerEnumsDefinition(contentType, registerOptions);
      registerDynamicZonesDefinition(contentType, registerOptions);
      registerFiltersDefinition(contentType, registerOptions);
      registerInputsDefinition(contentType, registerOptions);

      // Generate & register component's definition
      if (modelType === 'component') {
        registerComponent(contentType, registerOptions);
      }

      // Generate & register single type's definition
      else if (kind === 'singleType') {
        registerSingleType(contentType, registerOptions);
      }

      // Generate & register collection type's definition
      else if (kind === 'collectionType') {
        registerCollectionType(contentType, registerOptions);
      }
    }
  };

  const registerMorphTypes = (contentTypes: ContentType[]) => {
    // Create & register a union type that includes every type or component registered
    const genericMorphType = builders.buildGenericMorphDefinition();

    registry.register(GENERIC_MORPH_TYPENAME, genericMorphType, { kind: KINDS.morph });

    for (const contentType of contentTypes) {
      registerPolymorphicContentType(contentType, { registry, strapi });
    }
  };

  return { buildSchema };
};
