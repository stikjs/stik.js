module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '<%= pkg.banner.divider %>' +
              '<%= pkg.banner.project %>' +
              '<%= pkg.banner.copyright %>' +
              '<%= pkg.banner.license %>' +
              '<%= pkg.banner.licenseLink %>' +
              '<%= pkg.banner.divider %>' +
              '\n' +
              '// Version: <%= pkg.version %> | From: <%= grunt.template.today("dd-mm-yyyy") %>\n\n'
    },
    concat: {
      options: {
        separator: '\n',
        stripBanners: {
          block: true,
          line: true
        },
        banner: '<%= meta.banner %>'
      },
      light: {
        src: [ 'stik-core/stik-core.js' ],
        dest: 'stik-light.js',
        nonull: true
      },
      full: {
        src: [
          'stik-core/stik-core.js',
          'stik-helpers/stik-helpers.js',
          'stik-view-bag/stik-view-bag.js',
          'stik-courier/stik-courier.js',
          'stik-dom/stik-dom.js',
          'stik-url/stik-url.js',
          'stik-labs/stik-labs.js'
        ],
        dest: '<%= pkg.name %>',
        nonull: true
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>',
        mangle: false
      },
      full: {
        files: {
          'stik.min.js': ['stik.js']
        }
      },
      light: {
        files: {
          'stik-light.min.js': ['stik-light.js']
        }
      }
    },
    compress: {
      full: {
        options: {
          archive: 'stik-min.zip'
        },
        files: [
          {src: 'stik.min.js'} // includes files in path
        ]
      },
      light: {
        options: {
          archive: 'stik-light-min.zip'
        },
        files: [
          {src: 'stik-light.min.js'} // includes files in path
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('pack', ['concat', 'uglify', 'compress']);
};
