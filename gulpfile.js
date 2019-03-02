const gulp = require('gulp')
const sass = require('gulp-sass')

sass.complier = require('node-sass')

gulp.task('sass', () => gulp.src('manager/**/*.scss')
  .pipe(sass())
  .pipe(gulp.dest('manager/'))
)

gulp.task('auto', () => gulp.watch('manager/**/*.scss', gulp.series('sass')))

gulp.task('default', gulp.series('sass', 'auto'))
