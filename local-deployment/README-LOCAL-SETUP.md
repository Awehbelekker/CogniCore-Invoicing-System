# 🏠 CogniCore Local Deployment Guide

## Quick Start (15 minutes)

### Step 1: Install Ollama (Local LLM Server)

**Windows:**
```powershell
# Download from https://ollama.com/download
# Or use winget:
winget install Ollama.Ollama
```

**Linux/Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Download Pre-trained Models (NO TRAINING NEEDED!)

```bash
# Main chat model (4.7 GB) - Best quality
ollama pull llama3.1:8b

# Alternative (4.1 GB) - Faster
ollama pull mistral:7b

# Vision model for OCR backup (4.7 GB)
ollama pull llava:7b
```

### Step 3: Start Ollama Server

```bash
ollama serve
# Server runs on http://localhost:11434
```

### Step 4: Install Local Whisper (Optional - for voice)

```bash
# Option A: Whisper.cpp (Recommended)
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
# Download model
./models/download-ggml-model.sh medium

# Option B: Faster Whisper (Python)
pip install faster-whisper
```

### Step 5: Serve the Application

```bash
# Simple Python server
python -m http.server 8000

# Or Node.js
npx serve .

# Or Nginx (production)
# Copy files to /var/www/cognicore
```

---

## What Models to Use (All FREE & Pre-trained)

| Use Case | Model | Size | Download Command |
|----------|-------|------|------------------|
| Chat/AI Assistant | Llama 3.1 8B | 4.7 GB | `ollama pull llama3.1:8b` |
| Fast responses | Mistral 7B | 4.1 GB | `ollama pull mistral:7b` |
| OCR/Vision | LLaVA 7B | 4.7 GB | `ollama pull llava:7b` |
| Voice (small) | Whisper Small | 461 MB | Built-in browser API works! |
| Voice (accurate) | Whisper Medium | 1.5 GB | Download from HuggingFace |

---

## Hardware Recommendations

### Budget Setup (~$500)
- CPU: Intel i5/Ryzen 5
- RAM: 16 GB
- GPU: None (CPU inference)
- Speed: ~5 tokens/second

### Recommended Setup (~$1500)
- CPU: Intel i7/Ryzen 7
- RAM: 32 GB
- GPU: RTX 3060 12GB
- Speed: ~30 tokens/second

### Enterprise Setup (~$5000+)
- CPU: Xeon/Threadripper
- RAM: 64+ GB
- GPU: RTX 4090 24GB or A100
- Speed: ~100 tokens/second

---

## No Internet Required After Setup!

Once models are downloaded, the system works **100% offline**:

✅ Local LLM (Ollama) - Chat, insights, recommendations
✅ Tesseract.js - OCR scanning (already built-in!)
✅ Browser Speech API - Voice input
✅ Local storage - All data stays on device

---

## API Endpoints Mapping

| Cloud Endpoint | Local Replacement |
|---------------|-------------------|
| api.together.xyz | localhost:11434 (Ollama) |
| api.openai.com/whisper | localhost:8081 (Whisper.cpp) |
| Replicate OCR | Tesseract.js (built-in) |

---

## Docker Deployment (Easiest for Production)

```yaml
# docker-compose.yml
version: '3.8'
services:
  cognicore:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./:/usr/share/nginx/html
  
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  ollama_data:
```

Run: `docker-compose up -d`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Ollama not responding | Run `ollama serve` in terminal |
| Model too slow | Use smaller model: `mistral:7b` |
| Out of memory | Use quantized model: `llama3.1:8b-q4_0` |
| Voice not working | Browser Speech API is automatic fallback |
| OCR not working | Tesseract.js works offline automatically |

