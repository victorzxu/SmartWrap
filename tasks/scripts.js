import gulp from "gulp";
import gulpif from "gulp-if";
import {colors, log} from "gulp-util";
import named from "vinyl-named";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import plumber from "gulp-plumber";
import livereload from "gulp-livereload";
import args from "./lib/args";
import {multivendor} from "./lib/multisrc";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import dest from 'gulp-dest';

const ENV = args.production ? 'production' : 'development';

gulp.task('scripts', (cb) => {
  return gulp.src(multivendor('scripts/*.js'))
    .pipe(plumber({
      errorHandler: function () {
        // Webpack will log the errors
      }
    }))
    .pipe(named())
    .pipe(gulpWebpack({
      devtool: !args.production ? 'inline-source-map' : null,
      watch: args.watch,
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify(ENV)
          },
          '__ENV__': JSON.stringify(ENV),
          '__VENDOR__': JSON.stringify(args.vendor)
        }),
        new ExtractTextPlugin("[name].css"),
      ].concat(args.production ? [
        new webpack.optimize.UglifyJsPlugin()
      ] : []),
      module: {
        preLoaders: [{
          test: /\.js$/,
          loader: 'eslint-loader',
          exclude: /(node_modules|yxl-sidebar)/
        }],
        loaders: [{
          test: /\.js$/,
          loader: 'babel',
          exclude: /yxl-sidebar/
        },
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap") // yxl: TODO: remove the sourcemap when appropriate
          },
          {
            test: /\.(png|jpg|gif)$/,
            loader: 'url-loader?name=images/[name].[ext]&limit=8192'
          },
        ]
      },
      eslint: {
        configFile: '.eslintrc'
      }
    }, null, (err, stats) => {
      log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
        chunks: false,
        colors: true,
        cached: false,
        children: false
      }));
    }))
    .pipe(gulpif(/\.css$/, dest('../styles', {ext: '.css'})))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()));
});
