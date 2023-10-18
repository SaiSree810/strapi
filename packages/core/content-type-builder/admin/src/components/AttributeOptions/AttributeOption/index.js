/**
 *
 * AttributeOption
 *
 */

import React from 'react';

import { Box, Flex, Typography, Icon } from '@strapi/design-system';
import { Spark } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import useFormModalNavigation from '../../../hooks/useFormModalNavigation';
import getTrad from '../../../utils/getTrad';
import AttributeIcon from '../../AttributeIcon';
import OptionBoxWrapper from '../OptionBoxWrapper';

const AttributeOption = ({ type }) => {
  const { formatMessage } = useIntl();

  const { onClickSelectField } = useFormModalNavigation();

  const handleClick = () => {
    const step = type === 'component' ? '1' : null;

    onClickSelectField({
      attributeType: type,
      step,
    });
  };

  return (
    <OptionBoxWrapper padding={4} as="button" hasRadius type="button" onClick={handleClick}>
      <Flex>
        <AttributeIcon type={type} />
        {/* TODO: Remove after the RTE Blocks Stable release (width) */}
        <Box paddingLeft={4} width="100%">
          {/* TODO: Remove after the RTE Blocks Stable release (justifyContent) */}
          <Flex justifyContent="space-between">
            <Typography fontWeight="bold">
              {formatMessage({ id: getTrad(`attribute.${type}`), defaultMessage: type })}
            </Typography>
            {/* Remove after the RTE Blocks Stable release */}
            {type === 'blocks' && (
              <Flex grow={1} justifyContent="flex-end">
                <Flex
                  gap={1}
                  fontSizes={0}
                  hasRadius
                  background="alternative100"
                  padding={`${2 / 16}rem ${4 / 16}rem`}
                >
                  <Icon
                    width={`${10 / 16}rem`}
                    height={`${10 / 16}rem`}
                    as={Spark}
                    color="alternative600"
                  />
                  <Typography textColor="alternative600" variant="sigma">
                    New
                  </Typography>
                </Flex>
              </Flex>
            )}
          </Flex>

          <Flex>
            <Typography variant="pi" textColor="neutral600">
              {formatMessage({
                id: getTrad(`attribute.${type}.description`),
                defaultMessage: 'A type for modeling data',
              })}
            </Typography>
          </Flex>
        </Box>
      </Flex>
    </OptionBoxWrapper>
  );
};

AttributeOption.defaultProps = {
  type: 'text',
};

AttributeOption.propTypes = {
  type: PropTypes.string,
};

export default AttributeOption;
