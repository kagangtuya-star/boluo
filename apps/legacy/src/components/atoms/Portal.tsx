import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
// 添加 findDOMNode 兼容性补丁
if (typeof ReactDOM.findDOMNode === 'undefined') {
  // @ts-ignore - 为 ReactDOM 添加已废弃的 findDOMNode 方法
  ReactDOM.findDOMNode = function findDOMNode(component) {
    return (
      component &&
      (component.nodeType === 1 ? component : ReactDOM.findDOMNode(component.render?.()))
    );
  };
}

const root = document.getElementById('portal') as HTMLDivElement;

export const Portal: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  return ReactDOM.createPortal(children, root);
});
