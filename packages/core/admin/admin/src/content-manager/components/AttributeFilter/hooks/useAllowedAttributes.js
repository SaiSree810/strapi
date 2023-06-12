import { findMatchingPermissions, useRBACProvider } from '@strapi/helper-plugin';
import get from 'lodash/get';
import { useRBACProvider, findMatchingPermissions, useCollator } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';

const NOT_ALLOWED_FILTERS = ['json', 'component', 'media', 'richtext', 'dynamiczone', 'password'];
const TIMESTAMPS = ['createdAt', 'updatedAt'];

const useAllowedAttributes = (contentType, slug) => {
  const { allPermissions } = useRBACProvider();
  const { locale } = useIntl();

  const formatter = useCollator(locale, {
    sensitivity: 'base',
  });

  const readPermissionsForSlug = findMatchingPermissions(allPermissions, [
    {
      action: 'plugin::content-manager.explorer.read',
      subject: slug,
    },
  ]);

  const readPermissionForAttr = get(readPermissionsForSlug, ['0', 'properties', 'fields'], []);
  const attributesArray = Object.keys(get(contentType, ['attributes']), {});
  const allowedAttributes = attributesArray
    .filter((attr) => {
      const current = get(contentType, ['attributes', attr], {});

      if (!current.type) {
        return false;
      }

      if (NOT_ALLOWED_FILTERS.includes(current.type)) {
        return false;
      }

      if (!readPermissionForAttr.includes(attr) && attr !== 'id' && !TIMESTAMPS.includes(attr)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => formatter.compare(a, b));

  return allowedAttributes;
};

export default useAllowedAttributes;
