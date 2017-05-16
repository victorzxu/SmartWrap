import gulp from 'gulp';
import gulpif from 'gulp-if';
import imagemin from 'gulp-imagemin';
import livereload from 'gulp-livereload';
import args from './lib/args';
import {multivendor} from './lib/multisrc';

gulp.task('images', () => {
  return gulp.src(multivendor('images/**/*'))
    .pipe(gulpif(args.production, imagemin()))
    .pipe(gulp.dest(`dist/${args.vendor}/images`))
    .pipe(gulpif(args.watch, livereload()));
});
