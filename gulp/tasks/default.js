const config = require('../config.json');

const { pipeline } = require("stream");
const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');

gulp.task('default', cb => {
	// set up the browserify instance on a task basis
  let b = browserify({
    entries: config.paths.entry,
    debug: true,
    standalone: config.names.glob,
    transform: [
      babelify.configure({
        presets: ['@babel/preset-env'],
        sourceMapsAbsolute: true,
      }),
    ],
  });

	return pipeline([
		b.bundle(),
		source(config.names.app),
		buffer(),
		sourcemaps.init({loadMaps: true}),
		uglify()
			.on('error', gutil.log),
		sourcemaps.write('./'),
		gulp.dest(config.paths.dest)
	], cb)
});
