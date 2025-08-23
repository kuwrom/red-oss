# redxmoro AI Safety Testing Framework - Configuration & Monitoring UI

A comprehensive web-based interface for configuring, executing, and monitoring AI safety testing experiments using the redxmoro framework.

## 🌟 Features

### ⚙️ Configuration Management
- **API Keys & Credentials**: Secure management of AWS Bedrock and Google AI credentials
- **Model Configuration**: Configure target models (local HuggingFace or HTTP APIs)
- **Endpoint Setup**: Configure attacker and adjudicator models with custom parameters
- **Taxonomy Management**: Set up risk categories, attack patterns, and seed generation
- **Experiment Settings**: Control execution parameters and global settings

### 🎯 Strategy Control
- **Multiple Attack Strategies**: 
  - Iterative Refinement
  - Conversational Agent
  - Multi-Agent Coordination
  - Novelty Search
  - Programmatic Code Attacks
- **Quick Start Presets**: Pre-configured strategy combinations
- **Custom Parameters**: Fine-tune strategy behavior
- **Multi-Strategy Execution**: Run multiple strategies in parallel

### 📊 Live Monitoring
- **Flow Visualization**: Real-time experiment progress visualization
- **Event Timeline**: Detailed log of all experiment events
- **Live Attack Viewer**: Real-time conversation monitoring with sensitive content masking
- **Metrics Dashboard**: Success rates, progress tracking, and performance metrics

### 📈 Results & Analysis
- **Findings Overview**: Summary of discovered vulnerabilities
- **Novel Methods**: Detailed analysis of newly discovered attack techniques
- **Success Rate Analysis**: Breakdown by risk categories, strategies, and patterns
- **Detailed Results**: Comprehensive view of all attack attempts and outcomes

### 📝 Submission Management
- **Submission Generator**: Create Harmony-compatible submission files
- **Preview & Review**: Inspect submissions before finalizing
- **History Management**: Track and manage all generated submissions
- **Export Options**: Download submissions in various formats

## 🧪 How it works (Red‑teaming technique)

This project implements a taxonomy‑driven, strategy‑orchestrated red‑teaming pipeline with automated adjudication and live monitoring.

- **Configuration → Orchestration**
  - Users configure an experiment (target model, attacker/adjudicator endpoints, taxonomy, strategy set, and global flags).
  - The API validates, persists, and starts the experiment; the UI subscribes to live updates.

- **Taxonomy → Seed generation**
  - Risks and attack patterns load from YAML (`configs/taxonomy/risks.yaml`, `configs/taxonomy/patterns.yaml`).
  - Seeds are generated per (risk × pattern), optionally enriched by a methods catalog and meta‑LLM hypotheses; strict JSON parsing ensures valid seed lists.

- **Prompt expansion**
  - Each seed is expanded across languages and augmentations (base, many‑shot, roleplay, obfuscate).
  - Optional long‑context filler stresses context handling; optional tool‑use emulation wraps the prompt with a JSON tool‑planning schema (no execution).

- **Strategy execution**
  - Strategies iteratively converse with the target until success or a turn/step limit:
    - Iterative Refinement, Novelty Search, Programmatic Code Attack
    - Multi‑Agent (planner → executor → critic)
    - Hierarchical RL (planner chooses high‑level action, utterance policy realizes it; optional tool intents via middleware)
    - Evolutionary search (fitness = adjudicator score + stealth proxy; elitism + tournament + crossover/mutation)

- **Targets and simulators**
  - Targets can be HF models, HTTP APIs, or simulators (`rag`, `api`, `codegen`, `moe`). Simulators provide safety‑biased, controllable environments for testing routing, refusal, and benign responses.

- **Adjudication**
  - Automated single‑judge or courtroom (multi‑judge with optional deliberation and majority/consensus aggregation). Strict JSON outputs with robust fallbacks.

- **Logging, analysis, and UI**
  - Every attempt logs a structured event to `results/<run_id>/run_log.jsonl` (transcript, metrics, adjudication, causal failure analysis, novel methods).
  - The API tails the log and pushes metrics/events over WebSocket to the UI for timelines, progress, and dashboards.

### Key configuration flags

- **stop_on_success**: stop early when any strategy succeeds.
- **long_context_tokens**: prepend realistic filler up to N tokens.
- **tool_emulation**: wrap prompts to emulate tool‑use planning (no execution).
- **adjudication_orchestration**: automated vs courtroom; judges, rounds, aggregation.
- **tools_enabled**: enable tool middleware in strategies that support it (e.g., HRL).

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for redxmoro core and API server)
- Node.js 16+ (for React frontend)
- Git

### Installation & Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd temp-oss
```

2. **Start the development servers**:
```bash
./run.sh
```

This will:
- Install Python dependencies for the API server
- Install Node.js dependencies for the frontend
- Start the FastAPI backend on `http://localhost:8000`
- Start the Vite React frontend on `http://localhost:5173` (or `$PORT`)

3. **Access the application**:
- **Web UI**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

### Manual Setup

If you prefer to start services manually:

**Backend (Terminal 1)**:
```bash
cd api
pip install -r requirements.txt
python main.py
```

**Frontend (Terminal 2)**:
```bash
cd ui
npm install
npm run dev   # defaults to http://localhost:5173
```

## 📁 Project Structure

```
temp-oss/
├── 🎨 ui/                          # React frontend application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── tabs/              # Main tab components
│   │   │   ├── config/            # Configuration sections
│   │   │   ├── strategy/          # Strategy control components
│   │   │   ├── monitoring/        # Live monitoring components
│   │   │   ├── results/           # Results analysis components
│   │   │   └── submission/        # Submission management
│   │   ├── contexts/              # React contexts for state management
│   │   ├── index.css              # Tailwind CSS styling
│   │   └── main.tsx               # App entry
│   ├── package.json
│   └── vite.config.ts
│
├── 🔧 api/                         # FastAPI backend server
│   ├── main.py                     # Main FastAPI application
│   ├── requirements.txt            # Python dependencies
│   └── README.md                   # API documentation
│
├── 🧠 src/redxmoro/                   # Core redxmoro framework
│   ├── strategies/                 # Attack strategies
│   ├── runner.py                   # Experiment execution
│   ├── config.py                   # Configuration management
│   ├── analyzer.py                 # Results analysis
│   └── ...                        # Other core modules
│
├── ⚙️ configs/                     # Configuration files
│   ├── taxonomy/                   # Risk and pattern definitions
│   └── example_*.yaml              # Example configurations
│
├── 📊 results/                     # Experiment outputs
├── 📝 submission_compiler.py       # Submission generator script
├── 🚀 run.sh                       # Development server launcher
└── 📖 README.md                    # This file
```

## 🎯 Usage Guide

### 1. Initial Configuration

**Configure API Keys** (Configuration → API Keys):
- Add your AWS Bedrock credentials
- Add Google AI API key
- Test connections to ensure proper setup

**Set Up Target Model** (Configuration → Target Model):
- Choose between local HuggingFace model or HTTP API
- Configure generation parameters
- Set up API endpoints if using HTTP mode

**Configure Attack Models** (Configuration → Attacker/Adjudicator):
- Select models for generating attacks and evaluating results
- Customize system prompts
- Adjust generation parameters

### 2. Running Experiments

**Quick Start** (Strategy Control → Quick Start):
- Choose from preset configurations
- Use "Comprehensive Test" for thorough evaluation
- Use "Social Engineering Focus" for social manipulation testing

**Custom Configuration**:
- Select individual strategies
- Adjust strategy parameters
- Configure global experiment settings

### 2b. Headless CLI (no UI)

Run experiments and analyze results from the terminal:

```bash
# From project root
export PYTHONPATH=src

# Run an experiment
python -m redxmoro.cli run --config configs/example_experiment.yaml

# Analyze a completed run log (writes JSON/CSV into ./analysis)
python -m redxmoro.cli analyze --run-log results/<run_id>/run_log.jsonl --out-dir analysis
```

### 3. Monitoring Progress

**Flow View**: Visualize experiment progression through different stages
**Timeline**: Monitor detailed events and logs in real-time
**Live Attacks**: Watch conversations unfold with attack masking

### 4. Analyzing Results

**Overview**: Get high-level statistics and recent findings
**Novel Methods**: Explore newly discovered attack techniques
**Analysis**: Deep dive into success rates and patterns
**Detailed Results**: Examine individual attack attempts

### 5. Creating Submissions

**Generator**: Configure what to include in submissions
**Preview**: Review findings before finalizing
**Download**: Export in Harmony-compatible JSON format

### Kaggle Offline Sweep (fast, concurrent)

Use the offline config to run multi-strategy concurrent sweeps and deduplicate for a novelty-leaning submission.

```bash
export PYTHONPATH=src

# Run concurrent multi-strategy sweep (simulator target for speed)
python -m redxmoro.cli run --config configs/example_kaggle_offline.yaml

# Find the latest run id
RUN_DIR=$(ls -td results/* | head -n1)

# Compile submission with severity filtering, n-gram dedup, top-k cap
python submission_compiler.py compile \
  --run-log "$RUN_DIR/run_log.jsonl" \
  --out submissions/findings.json \
  --min-score 3.0 \
  --dedup-threshold 0.8 \
  --top-k 200
```

Tips:
- Set `stop_on_success: false` to collect multiple distinct successes per prompt before deduplication.
- Use `adjudication_orchestration: courtroom` for more robust verdicts.
- Expand taxonomy: `languages` and `augmentations` to increase diversity.
- Enable parallelism: set `max_parallel_strategies` and `max_parallel_prompts` for speed. HF local model forces sequential for safety.
- Strategy presets: add `strategy_presets: [fast_sweep|comprehensive]` to quickly expand a plan.
- Artifacts: each run writes `seeds.json`, `expanded_prompts.json`, and per-result `artifact_<idx>_<strategy>.json` in the run folder for full traceability.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# AWS Credentials (optional, can be set in UI)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Google AI (optional, can be set in UI)
GOOGLE_API_KEY=your_google_api_key

# API Configuration
API_HOST=localhost
API_PORT=8000
# Frontend (Vite) configuration
# By default, run.sh sets Vite to PORT or 5173
PORT=5173
UI_PORT=5173
```

### Custom Configurations

- **Taxonomies**: Modify `configs/taxonomy/` files to customize risk categories and patterns
- **Strategies**: Extend strategy implementations in `src/redxmoro/strategies/`
- **Templates**: Customize submission templates and formats

## 🛠️ Development

### Frontend Development

```bash
cd ui
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd api
python main.py       # Start with auto-reload
pytest              # Run tests (when available)
```

### Tech Stack

**Frontend**:
- React 18 with TypeScript
- Tailwind CSS for styling
- Socket.IO for real-time communication
- Recharts for data visualization
- Monaco Editor for code editing

**Backend**:
- FastAPI with Python
- WebSocket support
- Pydantic for data validation
- Async/await for performance

## 🔒 Security Considerations

- **API Keys**: Stored locally, never transmitted to external services
- **Sensitive Content**: Automatic masking in live monitoring
- **Access Control**: Consider adding authentication for production use
- **Network Security**: Use HTTPS in production environments

## 🎪 Deployment

### Production Build

**Frontend**:
```bash
cd ui
npm run build
# Serve the dist/ directory with your web server
```

**Backend**:
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: ./ui
    ports:
      - "3000:3000"
  
  backend:
    build: ./api
    ports:
      - "8000:8000"
    volumes:
      - ./configs:/app/configs
      - ./results:/app/results
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:

1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs
4. Provide system information and logs

## 🔄 Updates

Check for updates regularly:
- Frontend dependencies: `npm update` in `ui/`
- Backend dependencies: `pip install -r requirements.txt --upgrade` in `api/`
- Core framework: Follow redxmoro update instructions

---

**⚠️ Important**: This is a security testing tool. Use only on systems you own or have explicit permission to test. Always follow responsible disclosure practices for any vulnerabilities discovered.