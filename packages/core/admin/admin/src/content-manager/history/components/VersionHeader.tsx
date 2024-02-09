import * as React from 'react';

import { HeaderLayout, Typography } from '@strapi/design-system';
import { Link } from '@strapi/design-system/v2';
import { ArrowLeft } from '@strapi/icons';
import { Contracts } from '@strapi/plugin-content-manager/_internal/shared';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';

import type { FormattedLayouts } from '../../utils/layouts';

Contracts.ContentTypes;

interface VersionHeaderProps {
  headerId: string;
  version: Contracts.HistoryVersions.HistoryVersionDataResponse;
  layout: FormattedLayouts;
}

export const VersionHeader = ({ headerId, version, layout }: VersionHeaderProps) => {
  const { formatMessage, formatDate } = useIntl();

  const mainField = layout.contentType.settings.mainField;
  const mainFieldValue = version.data[mainField];
  const formattedSubtitle = mainFieldValue
    ? formatMessage(
        {
          id: 'content-manager.history.version.subtitle',
          defaultMessage: '{hasLocale, select, true {{subtitle}, in {locale}} other {{subtitle}}}',
        },
        {
          hasLocale: Boolean(version.locale),
          subtitle: `${mainFieldValue} (${layout.contentType.info.singularName})`,
          locale: version.locale?.name,
        }
      )
    : null;

  return (
    <HeaderLayout
      id={headerId}
      title={formatDate(new Date(version.createdAt), {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })}
      subtitle={<Typography variant="epsilon">{formattedSubtitle}</Typography>}
      navigationAction={
        <Link
          startIcon={<ArrowLeft />}
          as={NavLink}
          // @ts-expect-error - types are not inferred correctly through the as prop.
          to=".."
        >
          {formatMessage({
            id: 'global.back',
            defaultMessage: 'Back',
          })}
        </Link>
      }
    />
  );
};
