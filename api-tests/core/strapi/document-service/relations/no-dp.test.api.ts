/**
 * Relations interactions with non DP content types.
 */
import { LoadedStrapi, Common } from '@strapi/types';
import { testInTransaction } from '../../../../utils';

const { createTestBuilder } = require('api-tests/builder');
const { createStrapiInstance } = require('api-tests/strapi');
const { createAuthRequest } = require('api-tests/request');

let strapi: LoadedStrapi;
const builder = createTestBuilder();
let productDocuments;
let tagDocuments;
let shopDocuments;
let rq;

const PRODUCT_UID = 'api::product.product' as Common.UID.ContentType;
const TAG_UID = 'api::tag.tag' as Common.UID.ContentType;
const SHOP_UID = 'api::shop.shop' as Common.UID.ContentType;

const productModel = {
  attributes: {
    name: {
      type: 'string',
    },
    tag: {
      type: 'relation',
      relation: 'oneToOne',
      target: TAG_UID,
    },
  },
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  displayName: 'Product',
  singularName: 'product',
  pluralName: 'products',
  description: '',
  collectionName: '',
};

const tagModel = {
  attributes: {
    name: { type: 'string' },
  },

  displayName: 'Tag',
  singularName: 'tag',
  pluralName: 'tags',
  description: '',
  collectionName: '',
};

const shopModel = {
  attributes: {
    name: { type: 'string' },
    products_ow: {
      type: 'relation',
      relation: 'oneToOne',
      target: PRODUCT_UID,
    },
    products_oo: {
      type: 'relation',
      relation: 'oneToOne',
      target: PRODUCT_UID,
      targetAttribute: 'shop',
    },
    products_mo: {
      type: 'relation',
      relation: 'manyToOne',
      target: PRODUCT_UID,
      targetAttribute: 'shops_mo',
    },
    products_om: {
      type: 'relation',
      relation: 'oneToMany',
      target: PRODUCT_UID,
      targetAttribute: 'shop_om',
    },
    products_mm: {
      type: 'relation',
      relation: 'manyToMany',
      target: PRODUCT_UID,
      targetAttribute: 'shops',
    },
    products_mw: {
      type: 'relation',
      relation: 'oneToMany',
      target: PRODUCT_UID,
    },
  },
  options: {
    draftAndPublish: false,
  },
  displayName: 'Shop',
  singularName: 'shop',
  pluralName: 'shops',
};

describe.skip('Document Service relations', () => {
  beforeAll(async () => {
    await builder
      .addContentTypes([tagModel, productModel, shopModel])
      .addFixtures('plugin::i18n.locale', [{ name: 'Es', code: 'es' }])
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    // PRODUCTS
    await strapi.db.query(PRODUCT_UID).createMany({
      data: [
        { documentId: 'Skate', name: 'Skate-En', locale: 'en', publishedAt: null },
        { documentId: 'Skate', name: 'Skate-En', locale: 'en', publishedAt: new Date() },
        { documentId: 'Skate', name: 'Skate-Es', locale: 'es', publishedAt: null },
        { documentId: 'Candle', name: 'Candle-En', locale: 'en', publishedAt: null },
        { documentId: 'Candle', name: 'Candle-Es', locale: 'es', publishedAt: null },
        { documentId: 'Mug', name: 'Mug-En', locale: 'en', publishedAt: null },
        { documentId: 'Mug', name: 'Mug-Es', locale: 'es', publishedAt: null },
      ],
    });

    // TAGS
    await strapi.db.query(TAG_UID).createMany({
      data: [
        { documentId: 'Tag1', name: 'Tag1', publishedAt: null },
        { documentId: 'Tag2', name: 'Tag2', publishedAt: null },
        { documentId: 'Tag3', name: 'Tag3', publishedAt: null },
      ],
    });

    productDocuments = strapi.documents(PRODUCT_UID);
    tagDocuments = strapi.documents(TAG_UID);
    shopDocuments = strapi.documents(SHOP_UID);
  });

  afterAll(async () => {
    // Delete all locales that have been created
    await strapi.db.query('plugin::i18n.locale').deleteMany({ where: { code: { $ne: 'en' } } });

    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Non DP (Shop) -> DP (Product)', () => {
    const xToOneRelations = ['products_ow', 'products_oo', 'products_mo'];
    const xToManyRelations = ['products_om', 'products_mm', 'products_mw'];
    const allRelations = [...xToOneRelations, ...xToManyRelations];

    describe('X to One relation', () => {
      // This will not happen, and we can connect publish as default
      it('Connect to the draft version by default', async () => {
        // Create shop targeting a draft product that also has a published version
        const shop = await shopDocuments.create({
          data: {
            products_mo: { documentId: 'Skate', locale: 'en' },
            products_oo: { documentId: 'Skate', locale: 'en' },
            products_ow: { documentId: 'Skate', locale: 'en' },
          },
          locale: 'en',
          populate: xToOneRelations,
        });

        // Products should be connected to the draft version by default
        xToOneRelations.forEach((relation) => {
          expect(shop[relation]).toMatchObject({
            name: 'Skate-En',
            locale: 'en',
            publishedAt: null,
          });
        });
      });

      it('Connect to the root status of the new shop', async () => {
        // Relations should connect to the status version that matches the shop status (published)
        const shopPublished = await shopDocuments.create({
          data: {
            products_mo: { documentId: 'Skate', locale: 'en' },
            products_oo: { documentId: 'Skate', locale: 'en' },
            products_ow: { documentId: 'Skate', locale: 'en' },
          },
          locale: 'en',
          status: 'published',
          populate: xToOneRelations,
        });

        xToOneRelations.forEach((relation) => {
          expect(shopPublished[relation]).toMatchObject({
            name: 'Skate-En',
            locale: 'en',
            publishedAt: expect.any(String),
          });
        });

        // Relations should connect to the status version that matches the shop status (draft)
        const shopDraft = await shopDocuments.create({
          data: {
            products_mo: { documentId: 'Skate', locale: 'en' },
            products_oo: { documentId: 'Skate', locale: 'en' },
            products_ow: { documentId: 'Skate', locale: 'en' },
          },
          locale: 'en',
          status: 'draft',
          populate: xToOneRelations,
        });

        xToOneRelations.forEach((relation) => {
          expect(shopDraft[relation]).toMatchObject({
            name: 'Skate-En',
            locale: 'en',
            publishedAt: null,
          });
        });
      });

      it('Publishing DP side should copy draft relation', async () => {
        // Create shop targeting a draft product
        const shop = await shopDocuments.create({
          data: {
            name: 'Shop1',
            products_mo: { documentId: 'Skate', locale: 'en', status: 'draft' },
            products_oo: { documentId: 'Skate', locale: 'en', status: 'draft' },
            products_ow: { documentId: 'Skate', locale: 'en', status: 'draft' },
          },
          status: 'published',
          locale: 'en',
        });

        // Publish connected product
        await productDocuments.publish('Skate', { locale: 'en' });

        // Get shop again to check if it's product relations are updated
        const updatedShop = await shopDocuments.findOne(shop.documentId, {
          locale: 'en',
          populate: xToOneRelations,
        });

        xToOneRelations.forEach((relation) => {
          // Initial shop should only be connected to draft version
          expect(shop[relation]).toMatchObject([
            { name: 'Skate-En', locale: 'en', publishedAt: null },
          ]);

          // After publishing the product, shop should be connected to both draft and published version
          expect(updatedShop[relation]).toMatchObject([
            { name: 'Skate-En', locale: 'en', publishedAt: null },
            { name: 'Skate-En', locale: 'en', publishedAt: expect.any(String) },
          ]);
        });
      });
    });
  });
});
