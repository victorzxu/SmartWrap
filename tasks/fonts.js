import gulp from 'gulp';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import args from './lib/args';
import {multivendor} from './lib/multisrc';

gulp.task('fonts', () => {
  return gulp.src(multivendor('fonts/**/*.{woff,woff2,ttf,eot,svg}'))
    .pipe(gulp.dest(`dist/${args.vendor}/fonts`))
    .pipe(gulpif(args.watch, livereload()));
});
