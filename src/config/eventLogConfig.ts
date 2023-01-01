const eventLogConfig = {
  helloMsg: 'Hello User !',
  isVisible: true,
  showBelowCanvas: true,

  // ************************************************************************
  // when windowed (aka win mode) the event log own container is kept below the
  // canvas container (both are part of the panel container of the window), the
  // height of the event log container is given as a % of the canvas container
  // height (aka the canvas display height)
  percHeightWin: 0.4, // 40% when win in its own container
  percHeightFull: 0.15, // 15 % of fs height in the same container
  // ************************************************************************
};

type EventLogConfig = typeof eventLogConfig & {
  fontSize: number;
  lineHeight: number;
};

export { EventLogConfig, eventLogConfig };
