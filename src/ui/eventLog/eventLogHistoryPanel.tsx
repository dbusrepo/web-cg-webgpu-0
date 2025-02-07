import { type JSX } from 'preact';
import { useLayoutEffect } from 'preact/hooks';

interface EventLogEntry {
  event: string;
  message: string;
}

interface EventHistoryProps {
  logs: EventLogEntry[];
  getPanelRef: () => HTMLElement; // parent panel ref
  autoScrollNewItems: boolean;
  scrollTopTo: number | undefined;
  searchTerm: string;
}

function EventLogHistoryPanel(props: Readonly<EventHistoryProps>): JSX.Element {
  const { logs, getPanelRef, autoScrollNewItems, scrollTopTo, searchTerm } =
    props;
  const els: JSX.Element[] = [];

  let lastMsgRef: HTMLElement | null;
  let _listRef: HTMLElement | null;

  const re = new RegExp(`(${searchTerm})`, 'ig');

  const genBody = (str: string): Array<string | JSX.Element> =>
    searchTerm
      ? str
          .split(re)
          .map((item) =>
            item.toLowerCase() === searchTerm.toLowerCase() ? (
              <span style={{ textDecoration: 'underline' }}>{item}</span>
            ) : (
              item
            ),
          )
      : [str];

  for (const [idx, log] of logs.entries()) {
    if (log.event) {
      els.push(<dt className="event-log-msg">{genBody(log.event)}</dt>);
    }
    if (log.message) {
      const ddProps = {
        className: 'event-log-msg',
        // ref: idx === logs.length - 1 ? (e) => (lastMsgRef = e!) : undefined,
        ...(idx === logs.length - 1
          ? {
              ref: (e: HTMLElement | null): void => {
                lastMsgRef = e!;
              },
            }
          : {}),
      };

      els.push(<dd {...ddProps}>{genBody(log.message)}</dd>);
    }
  }

  useLayoutEffect(() => {
    const parent = getPanelRef();
    if (parent) {
      if (scrollTopTo) {
        parent.scrollTop = scrollTopTo;
      } else if (autoScrollNewItems) {
        lastMsgRef?.scrollIntoView({ behavior: 'auto', block: 'end' });
        // const scrollY =
        //   parent.scrollHeight - parent.clientHeight - parent.scrollTop;
        // /* an imm scroll to bottom when there is too much to scroll */
        // if (scrollY > parent.clientHeight) {
        //   parent.scrollTop += scrollY;
        // } else if (lastMsgRef) {
        //   // otherwise do a smooth scroll
        //   lastMsgRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //   // lastMsgRef.scrollIntoView({ behavior: 'auto', block: 'end' });
        // }
      }
    }
  });

  return (
    <dl ref={(el) => (_listRef = el!)} className="event-log-history-panel">
      {els}
    </dl>
  );
}

export { EventLogHistoryPanel };
export type { EventLogEntry };
