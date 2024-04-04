import { Form } from '@strapi/admin/strapi-admin';
import { waitForElementToBeRemoved } from '@testing-library/react';
import { render as renderRTL, waitFor, server, screen } from '@tests/utils';
import { rest } from 'msw';
import { Route, Routes } from 'react-router-dom';

import { StageSelect } from '../StageSelect';

describe('StageSelect', () => {
  const render = (
    initialValues = {
      strapi_stage: {
        id: 1,
        color: '#4945FF',
        name: 'Stage 1',
      },
    }
  ) =>
    renderRTL(<StageSelect />, {
      renderOptions: {
        wrapper: ({ children }) => {
          return (
            <Routes>
              <Route
                path="/content-manager/:collectionType/:slug/:id"
                element={
                  <Form method="PUT" onSubmit={jest.fn()} initialValues={initialValues}>
                    {children}
                  </Form>
                }
              />
            </Routes>
          );
        },
      },
      initialEntries: ['/content-manager/collection-types/api::address.address/1234'],
    });

  it('renders a select input, if a workflow stage is assigned to the entity', async () => {
    const { user } = render();

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader'));

    await screen.findByRole('combobox');

    expect(screen.getByRole('combobox')).toHaveTextContent('Stage 1');

    await user.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it("renders the select as disabled with a hint, if there aren't any stages", async () => {
    server.use(
      rest.get('*/content-manager/:kind/:uid/:id/stages', (req, res, ctx) => {
        return res.once(ctx.json({ data: [] }));
      })
    );

    render();

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader'));

    await waitFor(() =>
      expect(screen.queryByRole('combobox')).toHaveAttribute('aria-disabled', 'true')
    );
    await screen.findByText('You don’t have the permission to update this stage.');
  });
});
