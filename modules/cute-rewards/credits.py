

images = [
  ('pig.png', 
   'http://openclipart.org/detail/87817/funny-piggy-face-by-palomaironique'),
  ('monkey.png',
   'http://openclipart.org/detail/81865/funny-monkey-face-by-martouf'),
  ('cat.png',
   'http://openclipart.org/detail/88075/funny-kitty-face-by-palomaironique'),
  ('panda.png',
   'http://openclipart.org/detail/88249/funny-panda-face-black-and-white-by-palomaironique'),
  ('penguin.png',
   'http://openclipart.org/detail/88681/funny-tux-face-by-palomaironique'),
  ('sheep.png',
   'http://openclipart.org/detail/89137/funny-sheep-face-white-cartoon-by-palomaironique'),
  ('walrus.png',
   'http://openclipart.org/detail/88051/funny-walrus-face-by-palomaironique')
  ]

soundfiles = ['awesome.ogg', 'congratulation.ogg', 'fantastic.ogg', 'good.ogg', 'great.ogg', 'perfect.ogg', 'super.ogg', 'waytogo.ogg']

print('<p>The files ' + ', '.join(['<a href="{url}">{filename}</a>'.format(url = u, filename = f) for (f, u) in images]) + \
    ' are Public Domain images from the <a href="http://openclipart.org/">Open Clipart</a> project.</p>')

print('<p>The files ' + ', '.join(soundfiles) + ' are copyright (C) 2003 Susan Rich, ' + \
          'licensed under the GNU General Public License, taken from the ' + \
          '<a href="http://gcompris.net/">GCcompris</a> project.</p>')
