'use strict';

const bootstrap = require('../bootstrap');

describe('Bootstrap', () => {
  test('Calls actionProvider with consistent permissions', async () => {
    const registerFn = jest.fn();

    global.strapi = {
      models: {},
      plugins: {
        i18n: {
          services: {
            'entity-service-decorator': {
              decorator: {},
            },
            locales: {
              initDefaultLocale: jest.fn(),
            },
          },
        },
      },
      entityService: { decorate: jest.fn() },
      admin: {
        services: {
          permission: {
            deleteByRolesIdForDeletion: jest.fn(),
            engine: {
              hooks: { willEvaluatePermission: { register: jest.fn() } },
              registerPermissionsHandler: jest.fn(),
            },
            sectionsBuilder: {
              addHandler: jest.fn(),
            },
            conditionProvider: {
              registerMany: jest.fn(),
            },
            actionProvider: {
              hooks: {
                appliesPropertyToSubject: { register: jest.fn() },
                willRegister: { register: jest.fn() },
              },
              appliesPropertyToSubject: jest.fn(),
              values: jest.fn(() => []),
              registerMany: registerFn,
            },
          },
        },
      },
    };

    await bootstrap();

    expect(registerFn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            Object {
              "category": "Internationalization",
              "displayName": "Create",
              "pluginName": "i18n",
              "section": "settings",
              "subCategory": "Locales",
              "uid": "locale.create",
            },
            Object {
              "category": "Internationalization",
              "displayName": "Read",
              "pluginName": "i18n",
              "section": "settings",
              "subCategory": "Locales",
              "uid": "locale.read",
            },
            Object {
              "category": "Internationalization",
              "displayName": "Update",
              "pluginName": "i18n",
              "section": "settings",
              "subCategory": "Locales",
              "uid": "locale.update",
            },
            Object {
              "category": "Internationalization",
              "displayName": "Delete",
              "pluginName": "i18n",
              "section": "settings",
              "subCategory": "Locales",
              "uid": "locale.delete",
            },
          ],
        ],
      ]
    `);
  });
});
