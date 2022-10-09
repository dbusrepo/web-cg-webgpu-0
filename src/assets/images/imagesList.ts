// Do not modify. This file is auto generated from images.res with make
const getImagesPaths = async () => {
  const paths = [
    import('./samplePNGImage.png'),
    import('./samplePNGImage2.png'),
  ];
  return (await Promise.all(paths)).map((imp) => imp.default);
};

const images = {
  IMG1: 'samplePNGImage.png',
  MYIMG: 'samplePNGImage2.png',
};

const ascImagesOffsetsImport = {
  IMG1: 0,
  MYIMG: 1,
};

export { images, getImagesPaths, ascImagesOffsetsImport };
