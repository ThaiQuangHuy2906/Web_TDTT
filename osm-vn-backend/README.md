---
title: OSM-VN Backend
emoji: 🗺️
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: "4.0.0"
app_file: app.py
pinned: false
---

# OSM-VN AI Backend

AI-powered backend for OSM-VN map application.

## Features

- 🤖 **AI Chatbot** - Travel assistant for Vietnam
- 🎯 **Smart POI Recommendations** - Personalized place suggestions
- 📝 **Auto POI Description** - Generate descriptions for places

## API Endpoints

### 1. Chat with AI
```bash
POST /chat
{
  "message": "Where should I eat in Ho Chi Minh?",
  "history": [],
  "location": {"lat": 10.7769, "lon": 106.7009, "name": "Ho Chi Minh City"}
}
```

### 2. Get POI Recommendations
```bash
POST /recommend-poi
{
  "user_history": ["cafe", "restaurant", "park"],
  "current_location": {"lat": 10.7769, "lon": 106.7009},
  "preferences": {"budget": "medium"}
}
```

### 3. Generate POI Description
```bash
POST /describe-poi
{
  "poi_name": "Ben Thanh Market",
  "poi_type": "marketplace",
  "location": "Ho Chi Minh City"
}
```

## Local Development

```bash
pip install -r requirements.txt
python app.py
```

## Deployment

Deployed on HuggingFace Spaces with CPU basic tier.

## License

Apache 2.0