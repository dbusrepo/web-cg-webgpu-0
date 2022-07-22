function loadFileAsArrayBuffer(file: File) {
  return new Promise(function (resolve) {
    let fileReader = new FileReader();
    fileReader.addEventListener('load', (e) => {
      resolve(e.target!.result);
    }, false);
    fileReader.readAsArrayBuffer(file);
  });
}

async function loadResAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise(
    function (resolve) {
      const img = new Image();
      img.addEventListener('load', () => {
        resolve(img);
      }, false);
      img.src = url;
    }
  );
}

async function loadImageAsImageData(url: string): Promise<ImageData> {
  const img = await loadImage(url);
  const ctx = Object.assign(document.createElement('canvas'), {
    width: img.width,
    height: img.height
  }).getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

export {
  loadImage,
  loadImageAsImageData,
  loadFileAsArrayBuffer,
  loadResAsArrayBuffer,
};

