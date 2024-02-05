/**
 * Create and get relations using the document service.
 */
import { LoadedStrapi } from '@strapi/types';
import { createTestSetup, destroyTestSetup } from '../../../../utils/builder-helper';
import resources from '../resources/index';
import { ARTICLE_UID, findArticleDb, AUTHOR_UID, findAuthorDb, CATEGORY_UID } from '../utils';
import { testInTransaction } from '../../../../utils';

describe('Document Service relations', () => {
  let testUtils;
  let strapi: LoadedStrapi;

  beforeAll(async () => {
    testUtils = await createTestSetup(resources);
    strapi = testUtils.strapi;
  });

  afterAll(async () => {
    await destroyTestSetup(testUtils);
  });

  // TODO: Test for all type of relations
  describe.skip('FindOne', () => {
    it('Can populate top level relations', async () => {
      const article = await strapi
        .documents(ARTICLE_UID)
        .findOne('Article1', { locale: 'en', populate: { categories: true } });

      // TODO: Category id should be the document id
      // expect(article.categories[0].id).toBe('Cat1-En');
    });

    it.todo('Can populate a nested relation');

    it.todo('Can populate a relation in component');

    it.todo('Can filter by a relation id ');

    it.todo('Can filter by a relation attribute');

    it.todo('Can select fields of relation');
  });

  describe('Create', () => {
    it('Can create a document with relations', async () => {
      const article = await strapi.documents(ARTICLE_UID).create({
        data: {
          title: 'Article with author',
          // Connect document id
          categories: ['Cat1'],
        },
        populate: { categories: true },
      });

      // TODO: Category id should be the document id
      expect(article.categories[0].id).toBe('Cat1');
    });
  });

  // TODO
  describe.skip('Update', () => {
    it('Can update a document with relations', async () => {
      const article = await strapi.documents(ARTICLE_UID).update('Article1', {
        locale: 'en',
        data: {
          title: 'Article with author',
          // Connect document id
          categories: ['Cat2-En'],
        },
        populate: { categories: true },
      });

      // TODO: Category id should be the document id
      // expect(article.categories[0].id).toBe('Cat2-En');
    });
  });

  describe('Publish', () => {
    it(
      'Publishing filters relations that do not have a published targeted document',
      testInTransaction(async () => {
        const article = await strapi.documents(ARTICLE_UID).create({
          data: { title: 'Article with author', categories: ['Cat1'] },
          populate: { categories: true },
        });

        const publishedArticles = await strapi.documents(ARTICLE_UID).publish(article.id, {
          populate: { categories: true },
        });
        const publishedArticle = publishedArticles.versions[0];

        expect(publishedArticles.versions.length).toBe(1);
        // Cat1 does not have a published document
        expect(publishedArticle.categories.length).toBe(0);
      })
    );

    it(
      'Publishing connects relation to the published targeted documents',
      testInTransaction(async () => {
        const article = await strapi.documents(ARTICLE_UID).create({
          data: { title: 'Article with author', categories: ['Cat1'] },
          populate: { categories: true },
        });

        // Publish connected category
        await strapi.documents(CATEGORY_UID).publish('Cat1', { locale: 'en' });

        const publishedArticles = await strapi.documents(ARTICLE_UID).publish(article.id, {
          locale: article.locale,
          populate: { categories: true },
        });
        const publishedArticle = publishedArticles.versions[0];

        expect(publishedArticles.versions.length).toBe(1);
        // Cat1 has a published document
        expect(publishedArticle.categories.length).toBe(1);
        expect(publishedArticle.categories[0].id).toBe('Cat1');
      })
    );
  });
});
