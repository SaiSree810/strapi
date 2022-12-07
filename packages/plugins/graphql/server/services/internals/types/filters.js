'use strict';

const { builder } = require('../../builders/pothosBuilder');

/**
 * Build a map of filters type for every GraphQL scalars
 * @return {Object<string, NexusInputTypeDef>}
 */
const buildScalarFilters = ({ strapi }) => {
  const { naming, mappers } = strapi.plugin('graphql').service('utils');
  const { helpers } = strapi.plugin('graphql').service('internals');

  return helpers.getEnabledScalars().reduce((acc, type) => {
    const operators = mappers.graphqlScalarToOperators(type);
    const typeName = naming.getScalarFilterInputTypeName(type);

    if (!operators || operators.length === 0) {
      return acc;
    }

    return {
      ...acc,

      [typeName]: builder.inputType(typeName, {
        fields(t) {
          const fieldsObj = {};
          for (const operator of operators) {
            fieldsObj[operator.fieldName] = operator.add(t, type);
          }

          return fieldsObj;
        },
      }),
    };
  }, {});
};

module.exports = (context) => ({
  scalars: buildScalarFilters(context),
});
