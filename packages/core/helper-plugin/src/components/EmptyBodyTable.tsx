import React from 'react';

import { Box, Flex, Loader, Tbody, Td, Tr, TdProps } from '@strapi/design-system';

import { EmptyStateLayout, EmptyStateLayoutProps } from './EmptyStateLayout';

export interface EmptyBodyTableProps
  extends Omit<EmptyStateLayoutProps, 'hasRadius' | 'shadow'>,
    Pick<TdProps, 'colSpan'> {
  isLoading?: boolean;
}

const EmptyBodyTable = ({ colSpan, isLoading = false, ...rest }: EmptyBodyTableProps) => {
  if (isLoading) {
    return (
      <Tbody>
        <Tr>
          <Td colSpan={colSpan}>
            <Flex justifyContent="center">
              <Box padding={11} background="neutral0">
                <Loader>Loading content...</Loader>
              </Box>
            </Flex>
          </Td>
        </Tr>
      </Tbody>
    );
  }

  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <EmptyStateLayout {...rest} hasRadius={false} shadow="" />
        </Td>
      </Tr>
    </Tbody>
  );
};

export { EmptyBodyTable };
