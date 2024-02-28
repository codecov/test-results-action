deploy:
	$(eval VERSION := $(shell cat package.json | grep '"version": ' | cut -d\" -f4))
	# below commands delete the tags locally and remotely
	git tag -d v1
	git push origin :v1
	git tag v1
	git tag v$(VERSION) -s -m ""
	git push origin --tags
