/**
 *
 * LeftMenuHeader
 *
 */

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo-admin.png';
import logo2x from '../../assets/images/logo-admin@2x.png';
import styles from './styles.scss';

function LeftMenuHeader() {
  return (
    <div className={styles.leftMenuHeader}>
      <Link to="/" className={styles.leftMenuHeaderLink}>
        <img
          className={styles.leftMenuHeaderLogo}
          src={logo}
          srcSet={`${logo} 1x, ${logo2x} 2x`}
          alt="logo" />
      </Link>
    </div>
  );
}

export default LeftMenuHeader;
