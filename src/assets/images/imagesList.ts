// Do not modify. This file is auto generated from images.res with make
const getImagesPaths = async () => {
  const paths = [
    import('./samplePNGImage2.png'),
    import('./samplePNGImage.png'),
  ];
  return (await Promise.all(paths)).map((imp) => imp.default);
};

const images = {
  MYIMG: 'samplePNGImage2.png',
  IMG1: 'samplePNGImage.png',
};

const ascImagesOffsetsImport = {
  MYIMG: 0,
  IMG1: 1,
};

export { images, getImagesPaths, ascImagesOffsetsImport };
