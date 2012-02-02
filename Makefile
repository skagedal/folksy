root_files =  index.html 
js_files := $(addprefix js/,folksy.js soundmanager2.js underscore-1.3.1.js sprintf-0.7-beta1.js jquery-1.7.1.js firebug-fallback.js)
swf_files := $(addprefix swf/,soundmanager2.swf soundmanager2_debug.swf soundmanager2_flash9.swf soundmanager2_flash9_debug.swf)
css_files := $(addprefix css/,folkesfolk.css reset.css)
themes_files := themes/sunset/background.jpg 
letters_files := themes/sunset/letters/*
rewards_sound_files := themes/sunset/rewards/sound/*
rewards_images_files := themes/sunset/rewards/images/*
icons_files = icons/info.png icons/success.png icons/warning.png icons/error.png

all: doc

.PHONY: up updoc test

up:
ifndef FOLKSY_WEBROOT
	@echo "Please set FOLKSY_WEBROOT to install target"
else
	install -d $(addprefix $(FOLKSY_WEBROOT)/,js swf css icons themes/sunset themes/sunset/letters themes/sunset/rewards themes/sunset/rewards/images themes/sunset/rewards/sound)
	install $(root_files) $(FOLKSY_WEBROOT)
	install $(js_files) $(FOLKSY_WEBROOT)/js
	install $(swf_files) $(FOLKSY_WEBROOT)/swf
	install $(css_files) $(FOLKSY_WEBROOT)/css
	install $(themes_files) $(FOLKSY_WEBROOT)/themes/sunset
	install $(letters_files) $(FOLKSY_WEBROOT)/themes/sunset/letters
	install $(rewards_sound_files) $(FOLKSY_WEBROOT)/themes/sunset/rewards/sound
	install $(rewards_images_files) $(FOLKSY_WEBROOT)/themes/sunset/rewards/images
	install $(icons_files) $(FOLKSY_WEBROOT)/icons
endif

updoc: doc
	cp README.html TODO.html ~/public_html/folkesfolk/

doc: README.html

%.html: %.txt
	asciidoc $<

test:
ifndef FOLKSY_WEBROOT
	@echo "Please set FOLKSY_WEBROOT to install target"
endif

