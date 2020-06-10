import React, { useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import useUser from '../../hooks/useUser';
import hasPermissions from '../../utils/hasPermissions';
import LoadingIndicatorPage from '../LoadingIndicatorPage';

const WithPagePermissions = ({ permissions, children }) => {
  const userPermissions = useUser();
  const [state, setState] = useState({ isLoading: true, canAccess: false });
  const isMounted = useRef(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const canAccess = await hasPermissions(userPermissions, permissions);

        if (isMounted.current) {
          setState({ isLoading: false, canAccess });
        }
      } catch (err) {
        if (isMounted.current) {
          console.error(err);

          strapi.notification.error('notification.error');

          setState({ isLoading: false });
        }
      }
    };

    checkPermission();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.isLoading) {
    return <LoadingIndicatorPage />;
  }

  if (!state.canAccess) {
    return <Redirect to="/" />;
  }

  return children;
};

WithPagePermissions.defaultProps = {
  permissions: [],
};

WithPagePermissions.propTypes = {
  children: PropTypes.node.isRequired,
  permissions: PropTypes.array,
};

export default WithPagePermissions;
