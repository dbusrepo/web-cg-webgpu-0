import { type JSX } from 'preact';
import { useEffect } from 'preact/hooks';

interface ConsoleEntry {
  stmt: string;
  msg: string;
}

interface ConsoleHistoryProps {
  stmts: ConsoleEntry[];
  getPanelRef: () => HTMLElement; // parent panel ref
  autoScrollNewItems: boolean;
  scrollTopTo: number | undefined;
}

function ConsoleHistoryPanel(
  props: Readonly<ConsoleHistoryProps>,
): JSX.Element {
  const { stmts, getPanelRef, autoScrollNewItems, scrollTopTo } = props;
  const els: JSX.Element[] = [];

  let lastStmtRef: HTMLElement | null;
  let _listRef: HTMLElement | null;

  for (const entry of stmts.values()) {
    entry.stmt && els.push(<dt className="console-stmt">{entry.stmt}</dt>);
    entry.msg &&
      els.push(
        <dd ref={(e) => (lastStmtRef = e!)} className="console-msg">
          {entry.msg}
        </dd>,
      );
  }

  useEffect(() => {
    const parent = getPanelRef();
    if (parent) {
      if (scrollTopTo) {
        // console.log('FORCE SCROLL TO ' + scrollTopTo);
        parent.scrollTop = scrollTopTo;
      } else if (autoScrollNewItems) {
        lastStmtRef?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }
  });

  return (
    <dl ref={(el) => (_listRef = el!)} className="console-history-panel">
      {els}
    </dl>
  );

  // return <>{els}</>;
}

export { ConsoleHistoryPanel };
export type { ConsoleEntry };
