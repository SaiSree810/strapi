import styled from 'styled-components';
import { Button, Text as TextBase } from '@buffetjs/core';

const Text = styled(TextBase)`
  padding: 0 15px 13px 15px;
`;

const AlignedButton = styled(Button)`
  margin: 29px 15px 0 15px;
  height: 34px;
`;

export { Text, AlignedButton };
