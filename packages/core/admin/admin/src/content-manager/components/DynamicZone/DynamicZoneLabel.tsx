import * as React from 'react';

import { Box, Flex, Typography } from '@strapi/design-system';
import { pxToRem } from '@strapi/helper-plugin';
import { MessageDescriptor, useIntl } from 'react-intl';

interface DynamicZoneLabelProps {
  label?: string;
  labelAction?: React.ReactNode;
  name: string;
  numberOfComponents?: number;
  required?: boolean;
  intlDescription?: MessageDescriptor;
}

const DynamicZoneLabel = ({
  label,
  labelAction,
  name,
  numberOfComponents = 0,
  required,
  intlDescription,
}: DynamicZoneLabelProps) => {
  const { formatMessage } = useIntl();
  const intlLabel = formatMessage({ id: label || name, defaultMessage: label || name });

  return (
    <Flex justifyContent="center">
      <Box
        paddingTop={3}
        paddingBottom={3}
        paddingRight={4}
        paddingLeft={4}
        borderRadius="26px"
        background="neutral0"
        shadow="filterShadow"
        color="neutral500"
      >
        <Flex direction="column" justifyContent="center">
          <Flex maxWidth={pxToRem(356)}>
            <Typography variant="pi" textColor="neutral600" fontWeight="bold" ellipsis>
              {intlLabel}&nbsp;
            </Typography>
            <Typography variant="pi" textColor="neutral600" fontWeight="bold">
              ({numberOfComponents})
            </Typography>
            {required && <Typography textColor="danger600">*</Typography>}
            {labelAction && <Box paddingLeft={1}>{labelAction}</Box>}
          </Flex>
          {intlDescription && (
            <Box paddingTop={1} maxWidth={pxToRem(356)}>
              <Typography variant="pi" textColor="neutral600" ellipsis>
                {formatMessage(intlDescription)}
              </Typography>
            </Box>
          )}
        </Flex>
      </Box>
    </Flex>
  );
};

export { DynamicZoneLabel };
export type { DynamicZoneLabelProps };
