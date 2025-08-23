# redxmoro API Server

FastAPI backend for the redxmoro AI Safety Testing Framework UI.

## Features

- REST API endpoints for experiment management
- WebSocket support for real-time monitoring
- Configuration management
- Submission generation and management
- Integration with redxmoro core functionality

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Endpoints

### Configuration
- `POST /api/config` - Save configuration
- `GET /api/configs` - List saved configurations  
- `GET /api/config/{id}` - Load configuration

### Experiments
- `POST /api/experiment/start` - Start experiment
- `POST /api/experiment/stop` - Stop experiment
- `POST /api/experiment/export` - Export results

### Submissions
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/{id}/download` - Download submission
- `DELETE /api/submissions/{id}` - Delete submission

### WebSocket
- `/ws` - WebSocket endpoint for real-time updates

## Development

The server supports hot reloading during development. File changes will automatically restart the server.

## Integration

This API is designed to work with:
- React frontend on port 3000
- redxmoro core library in `../src/`
- Configuration files in `../configs/`
- Results output in `../results/`
