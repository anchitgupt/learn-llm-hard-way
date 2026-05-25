# Run Learn LLM The Hard Way

## First Setup

```bash
uv venv --python 3.13 --seed .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[dev]"
npm install
npm --prefix apps/web install
npx playwright install chromium
```

## Run Tests

```bash
npm run labs:test
npm run api:test
npm run web:test
source .venv/bin/activate
npm run e2e
```

## Start Locally

Terminal 1:

```bash
source .venv/bin/activate
npm run api:dev
```

Terminal 2:

```bash
npm run web:dev
```

Open `http://127.0.0.1:5173`.
