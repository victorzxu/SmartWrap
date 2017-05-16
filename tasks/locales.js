import gulp from 'gulp';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import args from './lib/args';
import {multivendor} from './lib/multisrc';


gulp.task('locales', () => {
  return gulp.src(multivendor('_locales/**/*.json'))
    .pipe(gulp.dest(`dist/${args.vendor}/_locales`))
    .pipe(gulpif(args.watch, livereload()));
});
