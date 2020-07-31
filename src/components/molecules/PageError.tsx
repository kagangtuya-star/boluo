import * as React from 'react';
import styled from '@emotion/styled';
import Title from '@/components/atoms/Title';
import Text from '@/components/atoms/Text';

interface Props {}

interface State {
  error: unknown;
}

const Mask = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  padding: 2em;
  top: 0;
  left: 0;
  z-index: 1000;
`;

class PageError extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: unknown) {
    console.error(error);
    return { error };
  }
  render() {
    if (this.state.error !== undefined) {
      return (
        <Mask>
          <Title>发生未知错误</Title>
          <Text>
            请刷新重试，如果依然错误请联系网站管理员：<code>{String(this.state.error)}</code>
          </Text>
        </Mask>
      );
    }
    return this.props.children;
  }
}
export default PageError;
