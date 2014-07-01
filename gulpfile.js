var gulp   = require("gulp"),
    header = require("gulp-header"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    zip    = require("gulp-zip"),
    pkg    = require("./package.json");

var d = new Date();
var releaseDate = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear()

var fullStack = [
  "node_modules/stik-core/dist/stik-core.js",
  "node_modules/stik-courier/dist/stik-courier.js",
  "node_modules/stik-helpers/dist/stik-helpers.js",
  "node_modules/stik-view-bag/dist/stik-view-bag.js",
  "node_modules/stik-resource/dist/stik-resource.js",
  "node_modules/stik-dom/dist/stik-dom.js",
  "node_modules/stik-url/dist/stik-url.js",
  "node_modules/stik-labs/dist/stik-labs.js"
];

var lightStack = [
  "node_modules/stik-core/dist/stik-core.js",
];

var banner = [
  "<%= pkg.banner.divider %>",
  "<%= pkg.banner.project %>",
  "<%= pkg.banner.copyright %>",
  "<%= pkg.banner.license %>",
  "<%= pkg.banner.licenseLink %>",
  "<%= pkg.banner.divider %>",
  "\n// Version: <%= pkg.version %> | From: <%= date %>\n",
  ""].join("\n");

gulp.task("pack", function(){
  // full featured versions
  gulp.src(fullStack)
      .pipe(concat("stik.js"))
      .pipe(header(banner, { pkg: pkg, date: releaseDate }))
      .pipe(gulp.dest("dist"))
      .pipe(concat("stik.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("dist"));

  // light weight versions
  gulp.src(lightStack)
      .pipe(concat("stik-light.js"))
      .pipe(header(banner, { pkg: pkg, date: releaseDate }))
      .pipe(gulp.dest("dist"))
      .pipe(concat("stik-light.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("dist"));

  // light zipped version
  gulp.src("dist/stik-light.js")
      .pipe(zip("stik-light.js.zip"))
      .pipe(gulp.dest("dist"));

  // light minified zipped version
  gulp.src("dist/stik-light.min.js")
      .pipe(zip("stik-light.min.js.zip"))
      .pipe(gulp.dest("dist"));

  // normal zipped version
  gulp.src("dist/stik.js")
      .pipe(zip("stik.js.zip"))
      .pipe(gulp.dest("dist"));

  // normal minified zipped version
  gulp.src("dist/stik.min.js")
      .pipe(zip("stik.min.js.zip"))
      .pipe(gulp.dest("dist"));
});
