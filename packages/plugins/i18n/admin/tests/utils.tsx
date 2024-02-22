/* eslint-disable check-file/filename-naming-convention */
import * as React from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { fixtures } from '@strapi/admin-test-utils';
import { DesignSystemProvider } from '@strapi/design-system';
import { NotificationsProvider, Permission, RBACContext } from '@strapi/helper-plugin';
import {
  renderHook as renderHookRTL,
  render as renderRTL,
  waitFor,
  RenderOptions as RTLRenderOptions,
  RenderResult,
  act,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

import { PERMISSIONS } from '../src/constants';
import { i18nApi } from '../src/services/api';

import { server } from './server';
import { initialState } from './store';

setLogger({
  log: () => {},
  warn: () => {},
  error: () => {},
});

interface ProvidersProps {
  children: React.ReactNode;
  initialEntries?: MemoryRouterProps['initialEntries'];
}

const Providers = ({ children, initialEntries }: ProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const store = configureStore({
    preloadedState: initialState,
    reducer: combineReducers({
      [i18nApi.reducerPath]: i18nApi.reducer,
      admin_app: (state = initialState) => state,
      rbacProvider: (state = initialState) => state,
    }),
    middleware: (getDefaultMiddleware: any) => [
      ...getDefaultMiddleware({
        // Disable timing checks for test env
        immutableCheck: false,
        serializableCheck: false,
      }),
      i18nApi.middleware,
    ],
  });

  const i18nPermissions = Object.values(PERMISSIONS).flat();

  // en is the default locale of the admin app.
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <DesignSystemProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <IntlProvider locale="en" messages={{}} textComponent="span">
              <NotificationsProvider>
                <RBACContext.Provider
                  value={{
                    refetchPermissions: jest.fn(),
                    allPermissions: [
                      ...fixtures.permissions.allPermissions,
                      {
                        id: 314,
                        action: 'admin::users.read',
                        subject: null,
                        properties: {},
                        conditions: [],
                        actionParameters: {},
                      },
                      ...i18nPermissions,
                    ] as Permission[],
                  }}
                >
                  {children}
                </RBACContext.Provider>
              </NotificationsProvider>
            </IntlProvider>
          </QueryClientProvider>
        </DesignSystemProvider>
      </MemoryRouter>
    </Provider>
  );
};

// eslint-disable-next-line react/jsx-no-useless-fragment
const fallbackWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export interface RenderOptions {
  renderOptions?: RTLRenderOptions;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
  initialEntries?: MemoryRouterProps['initialEntries'];
}

const render = (
  ui: React.ReactElement,
  { renderOptions, userEventOptions, initialEntries }: RenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { wrapper: Wrapper = fallbackWrapper, ...restOptions } = renderOptions ?? {};

  return {
    ...renderRTL(ui, {
      wrapper: ({ children }) => (
        <Providers initialEntries={initialEntries}>
          <Wrapper>{children}</Wrapper>
        </Providers>
      ),
      ...restOptions,
    }),
    user: userEvent.setup(userEventOptions),
  };
};

const renderHook: typeof renderHookRTL = (hook, options) => {
  const { wrapper: Wrapper = fallbackWrapper, ...restOptions } = options ?? {};

  return renderHookRTL(hook, {
    wrapper: ({ children }) => (
      <Providers>
        <Wrapper>{children}</Wrapper>
      </Providers>
    ),
    ...restOptions,
  });
};

export { render, renderHook, waitFor, server, act, screen };
