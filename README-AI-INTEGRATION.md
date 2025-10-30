# 🤖 AI Integration Guide - GPT-OSS 120B

## Overview
Starklytics Suite now includes AI-powered features using OpenAI's GPT-OSS 120B model for:
- Real-time RPC data interpretation
- Interactive chat assistance
- Query suggestions and optimization

## 🚀 Quick Setup

### 1. Install GPT-OSS Model
```bash
# Run the setup script
./scripts/setup-gpt-oss.sh

# Or manually install
pip install -U transformers torch
pip install --pre vllm==0.10.1+gptoss \
    --extra-index-url https://wheels.vllm.ai/gpt-oss/ \
    --extra-index-url https://download.pytorch.org/whl/nightly/cu128 \
    --index-strategy unsafe-best-match
```

### 2. Start the Model Server
Choose one option:

**Option A: vLLM (Recommended)**
```bash
vllm serve openai/gpt-oss-120b
```

**Option B: Transformers**
```bash
transformers serve
transformers chat localhost:8000 --model-name-or-path openai/gpt-oss-120b
```

**Option C: Ollama (Consumer Hardware)**
```bash
ollama pull gpt-oss:120b
ollama run gpt-oss:120b
```

### 3. Start Starklytics Suite
```bash
pnpm install
pnpm run dev
```

## 🎯 Features

### AI Data Interpreter
- Automatically analyzes incoming RPC data
- Provides insights on network activity and trends
- Updates in real-time with new data

### AI Chat Assistant
- Interactive chatbot for platform help
- Pre-built query suggestions
- Context-aware responses about Starknet and bounties

### Query Suggestions
- Curated analytics queries
- Network, DeFi, and bounty metrics
- One-click query execution

## 🔧 Configuration

The AI integration uses these endpoints:
- Model Server: `http://localhost:8000`
- API Route: `/api/ai-chat`

## 💡 Usage Tips

1. **Start Model First**: Always start the GPT-OSS server before using AI features
2. **Hardware Requirements**: 120B model needs significant GPU memory
3. **Fallback**: Use gpt-oss-20b for lower-end hardware
4. **Performance**: vLLM provides better throughput than Transformers

## 🎨 UI Components

- `AIDataInterpreter`: Shows RPC data analysis
- `AIChatBox`: Interactive chat interface  
- `AIFloatingButton`: Chat toggle button
- `QuerySuggestions`: Predefined query templates

## 🔍 Troubleshooting

**AI features not working?**
- Check if model server is running on localhost:8000
- Verify GPU memory availability
- Try the smaller gpt-oss-20b model

**Performance issues?**
- Use vLLM instead of Transformers
- Reduce max_tokens in API calls
- Consider model quantization

## 📚 Model Information

- **Model**: openai/gpt-oss-120b
- **Size**: 120B parameters
- **Context**: Starknet analytics and bounty platform
- **Reasoning**: Adjustable (low/medium/high)
- **Tools**: Web browsing, function calling, agentic operations