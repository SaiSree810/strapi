import { formatLayouts } from '../layouts';

describe('layouts', () => {
  describe('formatLayouts', () => {
    it('should format the content type and components layouts', () => {
      const models = [
        {
          uid: 'compo',
          attributes: {
            full_name: {
              type: 'string',
              required: true,
            },

            city: {
              type: 'string',
              maxLength: 100,
            },

            compo: {
              type: 'component',
              repeatable: true,
            },
          },

          settings: { test: 'test' },
          options: { timestamps: false },
        },
        {
          attributes: {
            full_name: {
              type: 'string',
              required: true,
            },
            city: {
              type: 'string',
              maxLength: 100,
            },
            dz: {
              type: 'dynamiczone',
            },
            compo: {
              type: 'component',
              repeatable: true,
            },
          },
          uid: 'contentType',
        },
      ];
      const data = {
        components: {
          compo: {
            uid: 'compo',
            layouts: {
              edit: [
                [
                  { name: 'full_name', size: 6 },
                  { name: 'city', size: 6 },
                ],
                [{ name: 'compo', size: 12 }],
              ],
            },
            metadatas: {
              full_name: {
                edit: {
                  description: 'test',
                  editable: true,
                  label: 'Full_name',
                  placeholder: '',
                  visible: true,
                },
              },
              city: {
                edit: {
                  description: '',
                  editable: false,
                  label: 'City',
                  placeholder: '',
                  visible: true,
                },
              },
              compo: {
                edit: {
                  description: '',
                  editable: true,
                  label: 'compo',
                  placeholder: '',
                  visible: true,
                },
              },
            },
          },
        },
        contentType: {
          uid: 'contentType',
          layouts: {
            list: [],
            edit: [
              [{ name: 'dz', size: 12 }],
              [
                { name: 'full_name', size: 6 },
                { name: 'city', size: 6 },
              ],
              [{ name: 'compo', size: 12 }],
            ],
          },
          metadatas: {
            full_name: {
              edit: {
                description: 'test',
                editable: true,
                label: 'Full_name',
                placeholder: '',
                visible: true,
              },
            },
            city: {
              edit: {
                description: '',
                editable: false,
                label: 'City',
                placeholder: '',
                visible: true,
              },
            },
            dz: {
              edit: {
                description: '',
                editable: true,
                label: 'Dz',
                placeholder: '',
                visible: true,
              },
            },
            compo: {
              edit: {
                description: '',
                editable: true,
                label: 'compo',
                placeholder: '',
                visible: true,
              },
            },
          },
        },
      };

      // @ts-expect-error – TODO: fix this test
      const result = formatLayouts(data, models);

      expect(result.components.compo).toHaveProperty('attributes');
      expect(result.components.compo).toHaveProperty('layouts');
      expect(result.components.compo).toHaveProperty('metadatas');
      expect(result.contentType).toHaveProperty('attributes');
      expect(result.contentType).toHaveProperty('layouts');
      expect(result.contentType).toHaveProperty('metadatas');
      expect(result.contentType.layouts.edit).toEqual([
        [
          {
            name: 'dz',
            size: 12,
            fieldSchema: {
              type: 'dynamiczone',
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'Dz',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'full_name',
            size: 6,
            fieldSchema: {
              type: 'string',
              required: true,
            },
            metadatas: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          {
            name: 'city',
            size: 6,
            fieldSchema: {
              type: 'string',
              maxLength: 100,
            },
            metadatas: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'compo',
            size: 12,
            fieldSchema: {
              type: 'component',
              repeatable: true,
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        ],
      ]);
      expect(result.components.compo.layouts.edit).toEqual([
        [
          {
            name: 'full_name',
            size: 6,
            fieldSchema: {
              type: 'string',
              required: true,
            },
            metadatas: {
              description: 'test',
              editable: true,
              label: 'Full_name',
              placeholder: '',
              visible: true,
            },
          },
          {
            name: 'city',
            size: 6,
            fieldSchema: {
              type: 'string',
              maxLength: 100,
            },
            metadatas: {
              description: '',
              editable: false,
              label: 'City',
              placeholder: '',
              visible: true,
            },
          },
        ],
        [
          {
            name: 'compo',
            size: 12,
            fieldSchema: {
              type: 'component',
              repeatable: true,
            },
            metadatas: {
              description: '',
              editable: true,
              label: 'compo',
              placeholder: '',
              visible: true,
            },
          },
        ],
      ]);
    });
  });
});
