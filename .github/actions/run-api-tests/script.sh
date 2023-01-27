## disable EE if options not set
if [[ -z "$RUN_EE" ]]; then
  export STRAPI_DISABLE_EE=true
else
  export STRAPI_DISABLE_LICENSE_PING=true
fi

export ENV_PATH="$(pwd)/testApp/.env"
export JWT_SECRET="aSecret"
export NODE_OPTIONS="--max_old_space_size=6144"
opts=($DB_OPTIONS)
jestOptions=($JESTOPTIONS)
yarn run -s build:ts
yarn run -s test:generate-app "${opts[@]}"
yarn run -s test:api --no-generate-app --maxWorkers=1 "${jestOptions[@]}"
