import {
  ActionLayout,
  ContentLayout,
  Flex,
  HeaderLayout,
  IconButton,
  Typography,
} from '@strapi/design-system';
import { useRBAC } from '@strapi/helper-plugin';
import { Eye } from '@strapi/icons';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';

import { Filters } from '../../../../../../../admin/src/components/Filters';
import { Page } from '../../../../../../../admin/src/components/PageHelpers';
import { Pagination } from '../../../../../../../admin/src/components/Pagination';
import { Table } from '../../../../../../../admin/src/components/Table';
import { useTypedSelector } from '../../../../../../../admin/src/core/store/hooks';
import { useQueryParams } from '../../../../../../../admin/src/hooks/useQueryParams';
import { AuditLog } from '../../../../../../../shared/contracts/audit-logs';

import { Modal } from './components/Modal';
import { useAuditLogsData } from './hooks/useAuditLogsData';
import { useFormatTimeStamp } from './hooks/useFormatTimeStamp';
import { getDefaultMessage } from './utils/getActionTypesDefaultMessages';
import { getDisplayedFilters } from './utils/getDisplayedFilters';

const ListPage = () => {
  const { formatMessage } = useIntl();
  const permissions = useTypedSelector((state) => state.admin_app.permissions.settings);

  const {
    allowedActions: { canRead: canReadAuditLogs, canReadUsers },
    isLoading: isLoadingRBAC,
  } = useRBAC({
    ...permissions?.auditLogs,
    readUsers: permissions?.users.read || [],
  });

  const [{ query }, setQuery] = useQueryParams<{ id?: AuditLog['id'] }>();
  const {
    auditLogs,
    users,
    isLoading: isLoadingData,
    hasError,
  } = useAuditLogsData({
    canReadAuditLogs,
    canReadUsers,
  });

  const formatTimeStamp = useFormatTimeStamp();

  const displayedFilters = getDisplayedFilters({ formatMessage, users, canReadUsers });

  const headers: Table.Header<AuditLog, object>[] = [
    {
      name: 'action',
      label: formatMessage({
        id: 'Settings.permissions.auditLogs.action',
        defaultMessage: 'Action',
      }),
      sortable: true,
    },
    {
      name: 'date',
      label: formatMessage({
        id: 'Settings.permissions.auditLogs.date',
        defaultMessage: 'Date',
      }),
      sortable: true,
    },
    {
      name: 'user',
      label: formatMessage({
        id: 'Settings.permissions.auditLogs.user',
        defaultMessage: 'User',
      }),
      sortable: false,
      // In this case, the passed parameter cannot and shouldn't be something else than User
      cellFormatter: ({ user }) => (user ? user.displayName : ''),
    },
    {
      name: 'actions',
      label: formatMessage({
        id: 'Settings.permissions.auditLogs.actions',
        defaultMessage: 'Actions',
      }),
      sortable: false,
    },
  ];

  if (hasError) {
    return <Page.Error />;
  }

  const isLoading = isLoadingData || isLoadingRBAC;

  const { results = [] } = auditLogs ?? {};

  return (
    <Page.Main aria-busy={isLoading}>
      <Helmet
        title={formatMessage(
          { id: 'Settings.PageTitle', defaultMessage: 'Settings - {name}' },
          {
            name: formatMessage({
              id: 'global.auditLogs',
              defaultMessage: 'Audit Logs',
            }),
          }
        )}
      />
      <HeaderLayout
        title={formatMessage({
          id: 'global.auditLogs',
          defaultMessage: 'Audit Logs',
        })}
        subtitle={formatMessage({
          id: 'Settings.permissions.auditLogs.listview.header.subtitle',
          defaultMessage: 'Logs of all the activities that happened in your environment',
        })}
      />
      <ActionLayout
        startActions={
          <Filters.Root options={displayedFilters}>
            <Filters.Trigger />
            <Filters.Popover />
            <Filters.List />
          </Filters.Root>
        }
      />
      <ContentLayout>
        <Table.Root rows={results} headers={headers} isLoading={isLoading}>
          <Table.Content>
            <Table.Head>
              {headers.map((header) => (
                <Table.HeaderCell key={header.name} {...header} />
              ))}
            </Table.Head>
            <Table.Empty />
            <Table.Loading />
            <Table.Body>
              {results.map((log) => (
                <Table.Row key={log.id} onClick={() => setQuery({ id: log.id })}>
                  {headers.map((header) => {
                    const { name, cellFormatter } = header;

                    switch (name) {
                      case 'action':
                        return (
                          <Table.Cell key={name}>
                            <Typography textColor="neutral800">
                              {formatMessage(
                                {
                                  id: `Settings.permissions.auditLogs.${log.action}`,
                                  // @ts-expect-error – getDefaultMessage probably doesn't benefit from being so strongly typed unless we just add string at the end.
                                  defaultMessage: getDefaultMessage(log.action),
                                },
                                { model: (log.payload?.model as string) ?? '' }
                              )}
                            </Typography>
                          </Table.Cell>
                        );
                      case 'date':
                        return (
                          <Table.Cell key={name}>
                            <Typography textColor="neutral800">
                              {formatTimeStamp(log.date)}
                            </Typography>
                          </Table.Cell>
                        );
                      case 'user':
                        return (
                          <Table.Cell key={name}>
                            <Typography textColor="neutral800">
                              {cellFormatter ? cellFormatter(log, header) : '-'}
                            </Typography>
                          </Table.Cell>
                        );
                      case 'actions':
                        return null;
                      default:
                        return (
                          <Table.Cell key={name}>
                            <Typography textColor="neutral800">
                              {(log[name as keyof AuditLog] as string) || '-'}
                            </Typography>
                          </Table.Cell>
                        );
                    }
                  })}
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <Flex justifyContent="end">
                      <IconButton
                        onClick={() => setQuery({ id: log.id })}
                        aria-label={formatMessage(
                          { id: 'app.component.table.view', defaultMessage: '{target} details' },
                          { target: `${log.action} action` }
                        )}
                        noBorder
                        icon={<Eye />}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.Root>
        <Pagination.Root {...auditLogs?.pagination} defaultPageSize={24}>
          <Pagination.PageSize options={['12', '24', '50', '100']} />
          <Pagination.Links />
        </Pagination.Root>
      </ContentLayout>
      {query?.id && (
        <Modal handleClose={() => setQuery({ id: '' }, 'remove')} logId={query.id.toString()} />
      )}
    </Page.Main>
  );
};

const ProtectedListPage = () => {
  const permissions = useTypedSelector(
    (state) => state.admin_app.permissions.settings?.auditLogs?.main
  );

  return (
    <Page.Protect permissions={permissions}>
      <ListPage />
    </Page.Protect>
  );
};

export { ListPage, ProtectedListPage };
