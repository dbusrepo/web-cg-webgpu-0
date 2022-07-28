import { h, JSX } from 'preact';
import React, { useEffect } from 'react';

type ConsoleEntry = {
  stmt: string;
  msg: string;
};

type ConsoleHistoryProps = {
  stmts: ConsoleEntry[];
  getPanelRef: () => HTMLElement; // parent panel ref
  autoScrollNewItems: boolean;
  scrollTopTo: number | null;
};

function ConsoleHistoryPanel(props: ConsoleHistoryProps): JSX.Element {
  const { stmts, getPanelRef, autoScrollNewItems, scrollTopTo } = props;
  const els: JSX.Element[] = [];

  let lastStmtRef: HTMLElement | null = null;
  let listRef: HTMLElement;

  stmts.forEach((entry, idx) => {
    entry.stmt && els.push(<dt className="console-stmt">{entry.stmt}</dt>);
    entry.msg &&
      els.push(
        <dd ref={(e) => (lastStmtRef = e!)} className="console-msg">
          {entry.msg}
        </dd>,
      );
  });

  useEffect(() => {
    const parent = getPanelRef();
    if (parent) {
      if (scrollTopTo !== null) {
        // console.log('FORCE SCROLL TO ' + scrollTopTo);
        parent.scrollTop = scrollTopTo;
      } else if (autoScrollNewItems) {
        if (lastStmtRef) {
          lastStmtRef!.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }
    }
  });

  return (
    <dl ref={(el) => (listRef = el!)} className="console-history-panel">
      {els}
    </dl>
  );

  // return <>{els}</>;
}

export { ConsoleHistoryPanel, ConsoleEntry };
