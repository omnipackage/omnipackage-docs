.PHONY: deps serve build gh_deploy

deps:
	pip install -r requirements.txt

serve:
	mkdocs serve

build:
	mkdocs build

gh_deploy:
	mkdocs gh-deploy --force
