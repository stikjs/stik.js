var gulp   = require("gulp"),
    header = require("gulp-header"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    zip    = require("gulp-zip"),
    pkg = require("./package.json");

var d = new Date();
var releaseDate = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear()

var fullStack = [
  "stik-core/dist/stik-core.js",
  "stik-helpers/dist/stik-helpers.js",
  "stik-view-bag/dist/stik-view-bag.js",
  "stik-courier/dist/stik-courier.js",
  "stik-dom/stik-dom.js",
  "stik-url/stik-url.js",
  "stik-labs/dist/stik-labs.js"
];

var lightStack = [
  "stik-core/stik-core.js",
];

var noNPMStack = [
  "stik-core/dist/stik-core.js",
  "stik-helpers/dist/stik-helpers.js",
  "stik-view-bag/dist/stik-view-bag.js",
  "stik-courier/dist/stik-courier-full.js",
  "stik-dom/stik-dom.js",
  "stik-url/stik-url.js",
  "stik-labs/dist/stik-labs.js"
]

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

  // bloated versions
  gulp.src(noNPMStack)
      .pipe(concat("stik-bloated.js"))
      .pipe(header(banner, { pkg: pkg, date: releaseDate }))
      .pipe(gulp.dest("dist"))
      .pipe(concat("stik-bloated.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("dist"));

  // bloated zipped version
  gulp.src("dist/stik-bloated.js")
      .pipe(zip("stik-bloated.js.zip"))
      .pipe(gulp.dest("dist"));

  // bloated minified zipped version
  gulp.src("dist/stik-bloated.min.js")
      .pipe(zip("stik-bloated.min.js.zip"))
      .pipe(gulp.dest("dist"));

  // light zipped version
  gulp.src("dist/stik-light.js")
      .pipe(zip("stik-light.js.zip"))
      .pipe(gulp.dest("dist"));

  // light minified zipped version
  gulp.src("dist/stik-light.min.js")
      .pipe(zip("stik-light.js.zip"))
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
