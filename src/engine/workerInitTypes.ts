type WorkerInitImagesData = {
  totalImagesSize: number; // in bytes
  imagesSizes: [number, number][];
};

type WorkerInitData = WorkerInitImagesData; // {} & WorkerInitImagesData;

export { WorkerInitData, WorkerInitImagesData };
