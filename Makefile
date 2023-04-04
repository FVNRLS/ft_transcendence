name = ft_transcendence

# start the Docker Compose services using the configuration
all:
ifneq ($(wildcard ./docker/postgres_data),)
	$(info Postgres data directory already exists.)
else
	$(info Creating Postgres data directory...)
	$(shell mkdir -p ./docker/postgres_data)
endif
	@printf "Starting configuration ${name}...\n"
	@cd docker && docker-compose up

# rebuild the Docker images and starting the services
build:
	@printf "Building configuration ${name}...\n"
	@docker-compose -f ./docker/docker-compose.yml up --build

# stop and remove the containers, networks, and volumes created by the up 
down:
	@printf "Stopping configuration ${name}...\n"
	@docker-compose -f ./docker/docker-compose.yml down

# deletes unused containers, networks, images and volumes 
clean: down
	@printf "Deleting configuration ${name}...\n"
	@docker system prune -a --force

re: clean build

# removes all docker configurations - full cleanup
fclean: clean
	@printf "Deleting all docker configurations...\n"
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force

.PHONY : all build down re clean fclean
