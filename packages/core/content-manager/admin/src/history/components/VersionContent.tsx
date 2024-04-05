import * as React from 'react';

import { Form, useField, useStrapiApp } from '@strapi/admin/strapi-admin';
import {
  Alert,
  Box,
  ContentLayout,
  FieldLabel,
  Flex,
  Grid,
  GridItem,
  Link,
  Tooltip,
  Typography,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { COLLECTION_TYPES } from '../../constants/collections';
import { DocumentStatus } from '../../pages/EditView/components/DocumentStatus';
import {
  InputRenderer,
  type InputRendererProps,
} from '../../pages/EditView/components/InputRenderer';
import { getRelationLabel } from '../../utils/relations';
import { useHistoryContext } from '../pages/History';

import type { RelationsFieldProps } from '../../pages/EditView/components/FormInputs/Relations';
import type { RelationResult } from '../../services/relations';

const StyledAlert = styled(Alert)`
  button {
    display: none;
  }
`;

/* -------------------------------------------------------------------------------------------------
 * CustomRelationInput
 * -----------------------------------------------------------------------------------------------*/

const LinkEllipsis = styled(Link)`
  display: block;

  & > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
`;

const CustomRelationInput = (props: RelationsFieldProps) => {
  const { formatMessage } = useIntl();
  const {
    value: { results, meta },
  } = useField(props.name);

  return (
    <Box>
      <FieldLabel>{props.label}</FieldLabel>
      {results.length === 0 ? (
        <Typography>No content</Typography>
      ) : (
        <Flex direction="column" gap={2} alignItems="stretch">
          {(results as Record<string, unknown>[]).map((relationData, index) => {
            // @ts-expect-error – targetModel does exist on the attribute. But it's not typed.
            const href = `../${COLLECTION_TYPES}/${props.attribute.targetModel}/${relationData.documentId}`;
            const label = getRelationLabel(relationData as RelationResult, props.mainField);

            return (
              <Flex
                key={index}
                paddingTop={2}
                paddingBottom={2}
                paddingLeft={4}
                paddingRight={4}
                hasRadius
                borderColor="neutral200"
                background="neutral150"
                justifyContent="space-between"
              >
                <Box minWidth={0} paddingTop={1} paddingBottom={1} paddingRight={4}>
                  <Tooltip description={label}>
                    <LinkEllipsis forwardedAs={NavLink} to={href}>
                      {label}
                    </LinkEllipsis>
                  </Tooltip>
                </Box>
                <DocumentStatus status={relationData.status as string} />
              </Flex>
            );
          })}
          {meta.missingCount > 0 && (
            <StyledAlert
              variant="warning"
              closeLabel="Close"
              onClose={() => {}}
              title={formatMessage(
                {
                  id: 'content-manager.history.content.missing-relation.title',
                  defaultMessage:
                    '{number, plural, =1 {Missing relation} other {{number} missing relations}}',
                },
                { number: meta.missingCount }
              )}
            >
              {formatMessage(
                {
                  id: 'content-manager.history.content.missing-relation.message',
                  defaultMessage:
                    "{number, plural, =1 {It has} other {They have}} been deleted and can't be restored.",
                },
                { number: meta.missingCount }
              )}
            </StyledAlert>
          )}
        </Flex>
      )}
    </Box>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CustomMediaInput
 * -----------------------------------------------------------------------------------------------*/

const CustomMediaInput = (props: InputRendererProps) => {
  const {
    value: { results, meta },
  } = useField(props.name);
  const { formatMessage } = useIntl();

  const fields = useStrapiApp('CustomMediaInput', (state) => state.fields);
  const MediaLibrary = fields.media as React.ComponentType<
    InputRendererProps & { multiple: boolean }
  >;
  return (
    <Box>
      <Flex direction="column" gap={2} alignItems="stretch">
        <Form method="PUT" disabled={true} initialValues={{ [props.name]: results }}>
          <MediaLibrary {...props} disabled={true} multiple={results.length > 1} />
        </Form>
        {meta.missingCount > 0 && (
          <StyledAlert
            variant="warning"
            closeLabel="Close"
            onClose={() => {}}
            title={formatMessage(
              {
                id: 'content-manager.history.content.missing-asset.title',
                defaultMessage:
                  '{number, plural, =1 {Missing asset} other {{number} missing assets}}',
              },
              { number: meta.missingCount }
            )}
          >
            {formatMessage(
              {
                id: 'content-manager.history.content.missing-asset.message',
                defaultMessage:
                  "{number, plural, =1 {It has} other {They have}} been deleted in the Media Library and can't be restored.",
              },
              { number: meta.missingCount }
            )}
          </StyledAlert>
        )}
      </Flex>
    </Box>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CustomInputRenderer
 * -----------------------------------------------------------------------------------------------*/

const CustomInputRenderer = (props: InputRendererProps) => {
  switch (props.type) {
    case 'media':
      return <CustomMediaInput {...props} />;
    case 'relation':
      return <CustomRelationInput {...props} />;
    default:
      return <InputRenderer {...props} />;
  }
};

/* -------------------------------------------------------------------------------------------------
 * VersionContent
 * -----------------------------------------------------------------------------------------------*/

const VersionContent = () => {
  const { version, layout } = useHistoryContext('VersionContent', (state) => ({
    version: state.selectedVersion,
    layout: state.layout,
  }));

  return (
    <ContentLayout>
      <Form disabled={true} method="PUT" initialValues={version.data}>
        <Flex direction="column" alignItems="stretch" gap={6} position="relative">
          {layout.map((panel, index) => {
            if (panel.some((row) => row.some((field) => field.type === 'dynamiczone'))) {
              const [row] = panel;
              const [field] = row;

              return (
                <Grid key={field.name} gap={4}>
                  <GridItem col={12} s={12} xs={12}>
                    <CustomInputRenderer {...field} />
                  </GridItem>
                </Grid>
              );
            }

            return (
              <Box
                key={index}
                hasRadius
                background="neutral0"
                shadow="tableShadow"
                paddingLeft={6}
                paddingRight={6}
                paddingTop={6}
                paddingBottom={6}
                borderColor="neutral150"
              >
                <Flex direction="column" alignItems="stretch" gap={6}>
                  {panel.map((row, gridRowIndex) => (
                    <Grid key={gridRowIndex} gap={4}>
                      {row.map(({ size, ...field }) => {
                        return (
                          <GridItem col={size} key={field.name} s={12} xs={12}>
                            <CustomInputRenderer {...field} />
                          </GridItem>
                        );
                      })}
                    </Grid>
                  ))}
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </Form>
    </ContentLayout>
  );
};

export { VersionContent };
