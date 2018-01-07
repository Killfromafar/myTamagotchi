BUILD_NUMBER ?= $(shell date +%j%H%M)
COMPONENT = alexa-tamagotchi
LAMBDA_NAME = $(COMPONENT)-$(BUILD_NUMBER).zip
build: 
	npm install && \
	cp -r ./node_modules ./buildFolder && \
	cp -r ./config ./buildFolder && \
	cp -r ./lib ./buildFolder && \
	cp ./index.js ./buildFolder && \
	cp ./package.json ./buildFolder && \
	cd ./buildFolder && \
	zip -r  ~/builds/$(LAMBDA_NAME) * && \
	rm -rf ./buildFolder
