import { LoadedStrapi } from '@strapi/types';
import { PRODUCT_UID, CATEGORY_UID, models } from './utils';
import { transformParamsDocumentId } from '../id-transform';

const findProducts = jest.fn(() => ({}));
const findCategories = jest.fn(() => ({}));

const findManyQueries = {
  [PRODUCT_UID]: findProducts,
  [CATEGORY_UID]: findCategories,
} as Record<string, jest.Mock>;

// TODO: Relation between published documents
// TODO: Relation between non localized and localized documents
// TODO: Relation between ct with D&P enabled and ct with D&P disabled
describe('Transform relational data', () => {
  global.strapi = {
    // List models by uids
    getModel: (uid: string) => models[uid],
    // Mock content localization check
    plugins: {
      i18n: {
        services: {
          'content-types': {
            isLocalizedContentType(model: any) {
              // Localize category content type
              if (model.uid === CATEGORY_UID) {
                return true;
              }
              return false;
            },
          },
        },
      },
    },
    db: {
      query: jest.fn((uid) => ({ findMany: findManyQueries[uid] })),
    },
  } as unknown as LoadedStrapi;

  beforeEach(() => {
    findCategories.mockReturnValue([
      { id: 'doc1-en-draft', documentId: 'doc1', locale: 'en', publishedAt: null },
      { id: 'doc1-fr-draft', documentId: 'doc1', locale: 'fr', publishedAt: null },
      { id: 'doc2-en-draft', documentId: 'doc2', locale: 'en', publishedAt: null },
      { id: 'doc3-en-draft', documentId: 'doc3', locale: 'en', publishedAt: null },
      { id: 'doc4-en-draft', documentId: 'doc4', locale: 'en', publishedAt: null },
      { id: 'doc5-en-draft', documentId: 'doc5', locale: 'en', publishedAt: null },
      { id: 'doc6-en-draft', documentId: 'doc6', locale: 'en', publishedAt: null },
      { id: 'doc7-en-draft', documentId: 'doc7', locale: 'en', publishedAt: null },
      { id: 'doc8-en-draft', documentId: 'doc8', locale: 'en', publishedAt: null },
      { id: 'doc9-en-draft', documentId: 'doc9', locale: 'en', publishedAt: null },
      { id: 'doc10-en-draft', documentId: 'doc10', locale: 'en', publishedAt: null },
    ]);

    findProducts.mockReturnValue([
      { id: 'doc1-draft', documentId: 'doc1', locale: null, publishedAt: null },
      { id: 'doc1-published', documentId: 'doc1', locale: null, publishedAt: null },
      { id: 'doc2-draft', documentId: 'doc2', locale: null, publishedAt: null },
      { id: 'doc3-draft', documentId: 'doc3', locale: null, publishedAt: null },
    ]);
  });

  describe('Non I18n (products) -> I18n (categories)', () => {
    it('Shorthand syntax', async () => {
      const { data } = await transformParamsDocumentId(
        PRODUCT_UID,
        {
          data: {
            name: 'test',
            categories: [
              { id: 'doc1', locale: 'en' },
              { id: 'doc1', locale: 'fr' },
              { id: 'doc2', locale: 'en' },
            ],
            category: {
              id: 'doc4',
              locale: 'en',
            },
            relatedProducts: [{ id: 'doc1' }, { id: 'doc2', locale: null }],
          },
        },
        { locale: 'en', isDraft: true }
      );

      expect(data).toEqual({
        name: 'test',
        categories: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'],
        category: 'doc4-en-draft',
        relatedProducts: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'],
      });
    });
  });

  it('Longhand syntax', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: [{ id: 'doc1' }, { id: 'doc2' }, { id: 'doc3' }],
          category: { id: 'doc4' },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: [{ id: 'doc1-en-draft' }, { id: 'doc2-en-draft' }, { id: 'doc3-en-draft' }],
      category: { id: 'doc4-en-draft' },
    });
  });

  it('Set', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: { set: ['doc1', 'doc2', 'doc3'] },
          category: { set: 'doc4' },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: { set: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'] },
      category: { set: 'doc4-en-draft' },
    });
  });

  it('Connect', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: { connect: ['doc1', 'doc2', 'doc3'] },
          category: { connect: 'doc4' },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: { connect: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'] },
      category: { connect: 'doc4-en-draft' },
    });
  });

  it('Connect before', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: { connect: [{ id: 'doc1', position: { before: 'doc2' } }] },
          category: { connect: 'doc4' },
        },
      },
      { locale: 'en', isDraft: false }
    );

    expect(data).toEqual({
      name: 'test',
      categories: { connect: [{ id: 'doc1-en-draft', position: { before: 'doc2-en-draft' } }] },
      category: { connect: 'doc4-en-draft' },
    });
  });

  it('Connect after', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: { connect: [{ id: 'doc1', position: { after: 'doc2' } }] },
          category: { connect: 'doc4' },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: { connect: [{ id: 'doc1-en-draft', position: { after: 'doc2-en-draft' } }] },
      category: { connect: 'doc4-en-draft' },
    });
  });

  it('Disconnect', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: { disconnect: ['doc1', 'doc2', 'doc3'] },
          category: { disconnect: 'doc4' },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: { disconnect: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'] },
      category: { disconnect: 'doc4-en-draft' },
    });
  });

  it('Multiple', async () => {
    const { data } = await transformParamsDocumentId(
      PRODUCT_UID,
      {
        data: {
          name: 'test',
          categories: {
            set: ['doc1', 'doc2', 'doc3'],
            connect: ['doc4', 'doc5'],
            disconnect: ['doc6', 'doc7'],
          },
          category: {
            set: 'doc8',
            connect: 'doc9',
            disconnect: 'doc10',
          },
        },
      },
      { locale: 'en', isDraft: true }
    );

    expect(data).toEqual({
      name: 'test',
      categories: {
        set: ['doc1-en-draft', 'doc2-en-draft', 'doc3-en-draft'],
        connect: ['doc4-en-draft', 'doc5-en-draft'],
        disconnect: ['doc6-en-draft', 'doc7-en-draft'],
      },
      category: {
        set: 'doc8-en-draft',
        connect: 'doc9-en-draft',
        disconnect: 'doc10-en-draft',
      },
    });
  });
});
