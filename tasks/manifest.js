import gulp from "gulp";
import gulpif from "gulp-if";
import livereload from "gulp-livereload";
import jsonTransform from "gulp-json-transform";
import plumber from "gulp-plumber";
import applyBrowserPrefixesFor from "./lib/applyBrowserPrefixesFor";
import args from "./lib/args";
import {multivendor} from "./lib/multisrc";
import merge from "gulp-merge-json";

gulp.task('manifest', () => {
  return gulp.src(multivendor('manifest.json'))
    .pipe(merge({fileName:'manifest.json'}))
    .pipe(plumber())
    .pipe(
      jsonTransform(
        applyBrowserPrefixesFor(args.vendor)
        , 2 /* whitespace */
      )
    )
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()));
});
