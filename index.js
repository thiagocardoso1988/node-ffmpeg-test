var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
const { resolve } = require('path');

// const INPUT_VIDEO = './video-sample-horizontal.mp4';
// const INPUT_VIDEO = './video-sample.mp4';

const getVideoProbe = async (input) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(input)
      .ffprobe(0, (err, data) => {
        !err ? resolve(data) : reject(err)
      })
  })
}

const sliceVideo = async (input, sliceDuration=15) => {
  const probe = await getVideoProbe(INPUT_VIDEO)

  createFolder('./output')
  fs.writeFile('output/probe-output.json', JSON.stringify(probe), 'utf8', function(err) {
    if (err) throw err;
    // console.log('complete');
  });

  // console.log(JSON.stringify(probe))
  const videoDuration = parseFloat(probe.streams[0].duration)
  const chunks = calcVideoChunks(videoDuration, sliceDuration)
  const extension = input.split('.').slice(-1)[0]


  return new Promise((resolve, reject) => {
    // const ffmpegInstance = ffmpeg().input(input)
    const ffmpegInstance = ffmpeg().input(fs.createReadStream(input))
  
    chunks.forEach((chunk, index) => {
      const { start, end } = chunk
      const outputFile = `output/output_${index}_s${start}_e${end.toFixed(0)}.${extension}`
  
      ffmpegInstance
        .on('start', function(commandLine) {
          // console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
      // ffmpeg()
      //   .input(input)
        // .seekInput(start)
        .output(outputFile)
        .seek(start)
        .duration(15)
        // .seek(15)
        // .duration(15)
        // .setStartTime(start)
        // .withDuration(end)
        // .output(`output/output_${index}_s${start}_e${end.toFixed(0)}.${extension}`)
        // .on('progress', function(progress) {
        //   // console.log(`[Slice ${index}] Processing: ${progress.percent}% done`);
        //   // console.log(progress);
        // })
        .on('end', function(stdout, stderr) {
          // console.log('Transcoding succeeded !', outputFile);
          resolve()
        })
        // .run()
    })

    fs.writeFile('output/ffcomand-output.json', JSON.stringify(ffmpegInstance), 'utf8', function(err) {
      if (err) throw err;
      // console.log('complete');
    });

    ffmpegInstance.run()
  })
}

const calcVideoChunks = (videoDuration, sliceDuration) => {
  let chunks = []
  let parts = Math.floor(videoDuration / sliceDuration)
  if (videoDuration % sliceDuration > 0) {
    parts += 1
  }
  for (let chunk = 0; chunk < parts; chunk++) {
    let _start = chunk * sliceDuration
    let _end = _start + sliceDuration
    chunks.push({ start: _start, end: (_end > videoDuration ? videoDuration : _end)})
  }
  return chunks
}

const createFolder = (folder) => {
  if (!fs.existsSync(folder)){
    fs.mkdirSync(folder);
  }
}





const INPUT_VIDEO = process.argv[2]

if (!INPUT_VIDEO) {
  throw new Error('É necessário informar o arquivo de entrada')
}

sliceVideo(INPUT_VIDEO)
  .then(() => console.log('process finished!'))