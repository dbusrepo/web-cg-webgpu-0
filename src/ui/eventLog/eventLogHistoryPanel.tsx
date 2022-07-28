import { h, JSX } from 'preact';
import { useEffect } from 'react';

type Event = string;

type EventLogEntry = {
  event: Event;
  message: string;
};

type EventHistoryProps = {
  logs: EventLogEntry[];
  getPanelRef: () => HTMLElement; // parent panel ref
  autoScrollNewItems: boolean;
  scrollTopTo: number | null;
};

function EventLogHistoryPanel(props: EventHistoryProps): JSX.Element {
  const { logs, getPanelRef, autoScrollNewItems, scrollTopTo } = props;
  const els: JSX.Element[] = [];

  let lastMsgRef: HTMLElement | null = null;
  let listRef: HTMLElement;

  logs.forEach((log, idx) => {
    log.event && els.push(<dt className="event-log-type">{log.event}</dt>);
    log.message &&
      els.push(
        <dd
          ref={idx === logs.length - 1 ? (e) => (lastMsgRef = e!) : undefined}
          className="event-log-msg"
        >
          {log.message}
        </dd>,
      );
  });

  useEffect(() => {
    const parent = getPanelRef();
    if (parent) {
      if (scrollTopTo !== null) {
        parent.scrollTop = scrollTopTo;
      } else if (autoScrollNewItems) {
        const scrollY =
          parent.scrollHeight - parent.clientHeight - parent.scrollTop;
        /* an imm scroll to bottom when there is too much to scroll */
        if (scrollY > parent.clientHeight) {
          parent.scrollTop += scrollY;
        } else if (lastMsgRef) {
          // otherwise do a smooth scroll
          lastMsgRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  });

  return (
    <dl ref={(el) => (listRef = el!)} className="event-log-history-panel">
      {els}
    </dl>
  );
}

export { EventLogHistoryPanel, Event, EventLogEntry };
