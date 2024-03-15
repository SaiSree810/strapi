/* eslint-disable check-file/filename-naming-convention */
import * as React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { adminTestUtils } from '@strapi/admin/strapi-admin';
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
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

import { releaseApi } from '../src/services/release';

import { server } from './server';
import { initialState } from './store';

interface ProvidersProps {
  children: React.ReactNode;
  initialEntries?: MemoryRouterProps['initialEntries'];
}
const { storeConfig } = adminTestUtils;
const Providers = ({ children, initialEntries }: ProvidersProps) => {
  const store = configureStore({
    preloadedState: { ...storeConfig.preloadedState, ...initialState },
    reducer: {
      ...adminTestUtils.storeConfig.reducer,
      [releaseApi.reducerPath]: releaseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => [
      ...storeConfig.middleware(getDefaultMiddleware),
      releaseApi.middleware,
    ],
  });

  // en is the default locale of the admin app.
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <DesignSystemProvider locale="en">
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
                  ] as Permission[],
                }}
              >
                {children}
              </RBACContext.Provider>
            </NotificationsProvider>
          </IntlProvider>
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

export { render, renderHook, waitFor, act, screen, server };
