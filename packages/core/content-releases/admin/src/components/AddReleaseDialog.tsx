import * as React from 'react';

import {
  Button,
  ModalBody,
  ModalFooter,
  ModalLayout,
  ModalHeader,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import * as yup from 'yup';

import { createRelease, releaseSelector } from '../../modules/releaseSlice';
import { useTypedDispatch, useTypedSelector } from '../../store/hooks';

const releaseSchema = yup.object({
  name: yup.string().required(),
});

const INITIAL_VALUES = {
  name: '',
};

interface AddReleaseDialogProps {
  handleClose: () => void;
}

interface FormValues {
  name: string;
}

export const AddReleaseDialog = ({ handleClose }: AddReleaseDialogProps) => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { push } = useHistory();
  const dispatch = useTypedDispatch();
  const newRelease = useTypedSelector(releaseSelector);

  const handleSubmit = async (values: FormValues) => {
    const release = await dispatch(
      createRelease({
        name: values.name,
      })
    );

    if (!release.error) {
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: 'content-releases.modal.release-created-notification-success',
          defaultMessage: 'Release created.',
        }),
      });

      push(`/plugins/content-releases/${release.payload.id}`);
    } else {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: 'notification.error', defaultMessage: 'An error occurred' }),
      });
    }
  };

  return (
    <ModalLayout onClose={handleClose} labelledBy="title">
      <ModalHeader>
        <Typography id="title" fontWeight="bold" textColor="neutral800">
          {formatMessage({
            id: 'content-releases.modal.add-release-title',
            defaultMessage: 'New release',
          })}
        </Typography>
      </ModalHeader>
      <Formik
        validateOnChange={false}
        onSubmit={handleSubmit}
        initialValues={INITIAL_VALUES}
        validationSchema={releaseSchema}
      >
        {({ values, errors, handleChange }) => (
          <Form>
            <ModalBody>
              <TextInput
                label={formatMessage({
                  id: 'content-releases.modal.form.input.label.release-name',
                  defaultMessage: 'Name',
                })}
                name="name"
                value={values.name}
                error={errors.name}
                onChange={handleChange}
                required
              />
            </ModalBody>
            <ModalFooter
              startActions={
                <Button onClick={handleClose} variant="tertiary" name="cancel">
                  {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
                </Button>
              }
              endActions={
                <Button
                  name="submit"
                  loading={newRelease.loading}
                  disabled={!values.name}
                  type="submit"
                >
                  {formatMessage({
                    id: 'content-releases.modal.form.button.submit',
                    defaultMessage: 'Continue',
                  })}
                </Button>
              }
            />
          </Form>
        )}
      </Formik>
    </ModalLayout>
  );
};
