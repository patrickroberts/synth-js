const config = require('../config');

const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');

gulp.task('browserify', function () {
  // set up the browserify instance on a task basis
  let b = browserify({
    entries: config.paths.entry,
    debug: true,
    standalone: config.names.glob,
    transform: [
      babelify.configure({
        presets: ['es2015'],
        sourceMapsAbsolute: true,
      }),
    ],
  });

  return b.bundle()
    .pipe(source(config.names.app))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      // Add transformation tasks to the pipeline here.
      .pipe(uglify())
      .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.paths.dest));
});
