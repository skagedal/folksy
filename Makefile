js_files = js/soundmanager2.js   js/sprintf-0.7-beta1.js js/jquery-1.7.1.js
swf_files = swf/soundmanager2.swf swf/soundmanager2_debug.swf swf/soundmanager2_flash9.swf swf/soundmanager2_flash9_debug.swf
root_files =  index.html folkesfolk.js 
css_files = css/folkesfolk.css css/reset.css
themes_files = themes/sunset/background.jpg

all: doc

up:
ifndef FOLKSY_WEBROOT
	@echo "Please set FOLKSY_WEBROOT to install target"
else
	install -d $(FOLKSY_WEBROOT)/js $(FOLKSY_WEBROOT)/swf $(FOLKSY_WEBROOT)/css $(FOLKSY_WEBROOT)/themes/sunset
	install $(root_files) $(FOLKSY_WEBROOT)
	install $(js_files) $(FOLKSY_WEBROOT)/js
	install $(swf_files) $(FOLKSY_WEBROOT)/swf
	install $(css_files) $(FOLKSY_WEBROOT)/css
	install $(themes_files) $(FOLKSY_WEBROOT)/themes/sunset
endif

updoc: doc
	cp README.html TODO.html ~/public_html/folkesfolk/

doc: README.html TODO.html

%.html: %.txt
	asciidoc $<

test:
ifndef FOLKSY_WEBROOT
	@echo "Please set FOLKSY_WEBROOT to install target"
endif

