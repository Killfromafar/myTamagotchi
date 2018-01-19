BUILD_NUMBER ?= $(shell date +%j%H%M)
COMPONENT = alexa-tamagotchi
LAMBDA_NAME = $(COMPONENT)-$(BUILD_NUMBER).zip
build: 
	npm install && \
	cp -r ./node_modules ./buildFolder && \
	cp -r ./config ./buildFolder && \
	cp -r ./lib ./buildFolder && \
	cp ./index.js ./buildFolder && \
	cp ./IntentAmazonCancelIntent.js ./buildFolder && \
	cp ./IntentAmazonHelpIntent.js ./buildFolder && \
	cp ./IntentAmazonStopIntent.js ./buildFolder && \
	cp ./IntentBuyMedpack.js ./buildFolder && \
	cp ./IntentCleanPet.js ./buildFolder && \
	cp ./IntentCreateNewPet.js ./buildFolder && \
	cp ./IntentFeedPet.js ./buildFolder && \
	cp ./IntentLaunchRequest.js ./buildFolder && \
	cp ./IntentPlayGame.js ./buildFolder && \
	cp ./IntentStatus.js ./buildFolder && \
	cp ./IntentTreatSickness.js ./buildFolder && \
	cp ./IntentUnhandled.js ./buildFolder && \
	cp ./package.json ./buildFolder && \
	cd ./buildFolder && \
	zip -r  ~/builds/$(LAMBDA_NAME) * && \
	rm -rf ./buildFolder
