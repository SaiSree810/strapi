'use strict';

const { has } = require('lodash/fp');

const permissionModelUID = 'strapi::permission';

const hasAttribute = attribute => has(`attributes.${attribute}`);
const hasFieldsAttribute = hasAttribute('fields');
const hasPropertiesAttribute = hasAttribute('properties');

const shouldRunMigration = (definition, previousDefinition) => {
  const isAdminPermissionModel = definition.uid === permissionModelUID;

  const hadFieldsButNotProperties =
    hasFieldsAttribute(previousDefinition) && !hasPropertiesAttribute(previousDefinition);

  const hasPropertiesButNotFields =
    !hasFieldsAttribute(definition) && hasPropertiesAttribute(definition);

  const targetedFieldsHaveChanged = hadFieldsButNotProperties && hasPropertiesButNotFields;

  return isAdminPermissionModel && targetedFieldsHaveChanged;
};

const permissionsFinderByORM = {
  bookshelf: async model => {
    const permissions = await model.fetchAll();

    return permissions.toJSON().map(permission => ({
      ...permission,
      fields: JSON.parse(permission.fields),
    }));
  },
  mongoose: async model => {
    return model.find().lean();
  },
};

module.exports = {
  shouldRun: {
    before(options) {
      const { definition, previousDefinition } = options;

      return shouldRunMigration(definition, previousDefinition);
    },

    after(options, context) {
      const { definition, previousDefinition } = options;
      const { permissionsFieldsToProperties = {} } = context;
      const { permissions = [] } = permissionsFieldsToProperties;

      return shouldRunMigration(definition, previousDefinition) && permissions.length > 0;
    },
  },

  // Here we make a backup of the permission objects in the database, then we store it into the migration context
  async before(options, context) {
    const { model } = options;

    const permissions = await permissionsFinderByORM[model.ORM]();

    Object.assign(context, { permissionsFieldsToProperties: { permissions } });
  },

  // Based on the permissions sent in the context, we perform an update. { fields } => { properties: { fields } }
  async after(options, context) {
    const { model, ORM } = options;
    const { permissionsFieldsToProperties = {} } = context;
    const { permissions = [] } = permissionsFieldsToProperties;

    if (model.orm === 'bookshelf') {
      const update = async transacting => {
        for (const permission of permissions) {
          const { fields, ...rest } = permission;

          await model
            .forge({ id: rest.id })
            .save({ properties: { fields } }, { patch: true, transacting });
        }
      };

      await ORM.transaction(transacting => update(transacting));
    }

    if (model.orm === 'mongoose') {
      for (const permission of permissions) {
        const { fields, _id } = permission;

        await model.updateOne({ _id }, [
          { $set: { properties: { fields } } },
          { $unset: ['fields'] },
        ]);
      }
    }
  },
};
