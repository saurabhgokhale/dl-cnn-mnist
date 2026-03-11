# MNIST CNN Visualizer

An interactive educational tool that lets you see inside a Convolutional Neural Network as it classifies handwritten digits. Built for introducing deep learning concepts to middle and high school students.

**Live demo:** Runs entirely in the browser using TensorFlow.js — no backend required.

## Screenshots

### Main Visualizer
Digit selection, prediction, confidence chart, architecture diagram, and layer-by-layer activations.

![Main Visualizer](https://github.com/user-attachments/assets/0fe6a33a-8c24-4783-a14c-3bd2d80945f7)

### Draw Your Own Digit
Freehand canvas with real-time classification and activation visualization.

![Draw Your Own Digit](https://github.com/user-attachments/assets/34ee6acc-4621-4f5a-a3c8-f936f1f5bc68)

### Animated Data Flow
Step-by-step animation showing data transforming through each CNN layer.

![Animated Data Flow](https://github.com/user-attachments/assets/3d4babef-0b6d-4e9f-a107-6998d5606422)

### Algorithm Walkthrough
Detailed explanation of how the CNN algorithm works with annotated diagrams.

![Algorithm Walkthrough](https://github.com/user-attachments/assets/0af308c0-c14a-4182-9372-cb52ca2f50ac)

## Features

- **Interactive digit classification** — Pick any digit (0-9) or load a random MNIST sample and watch the CNN predict it in real time
- **Draw your own digit** — Freehand drawing canvas with MNIST-style preprocessing and instant classification
- **Animated data flow** — Step-by-step visualization of data transforming as it passes through each CNN layer
- **Layer-by-layer activations** — See the feature maps (conv/pool layers) and neuron activations (dense layers) with viridis colormapping
- **Confidence chart** — Bar chart showing prediction probabilities for all 10 digits
- **Architecture diagram** — Visual overview of the CNN structure with layer descriptions
- **Trained weights inspection** — View the actual learned filter kernels, weight matrices, and biases with a backpropagation explainer
- **Algorithm walkthrough** — Step-by-step explanation of the CNN algorithm with annotated code

## CNN Architecture

```
Input (28x28x1)
  -> Conv2D (8 filters, 3x3, ReLU)    -> 26x26x8
  -> MaxPool2D (2x2)                   -> 13x13x8
  -> Conv2D (8 filters, 3x3, ReLU)    -> 11x11x8
  -> MaxPool2D (2x2)                   -> 5x5x8
  -> Flatten                           -> 200
  -> Dense (128, ReLU) + Dropout(0.25)
  -> Dense (64, ReLU) + Dropout(0.25)
  -> Dense (10, Softmax)               -> prediction
```

Total parameters: 35,298

## Project Structure

```
mnist/
├── notebooks/
│   └── mnist_DL_CNN.ipynb       # Training notebook (Jupyter)
├── model/
│   └── mnist_cnn.keras          # Trained Keras model
├── backend/
│   ├── main.py                  # FastAPI server (optional)
│   └── inference.py             # Python inference + activation extraction
├── frontend/
│   ├── app/
│   │   ├── page.js              # Main visualizer page
│   │   ├── draw/page.js         # Draw your own digit
│   │   ├── dataflow/page.js     # Animated data flow
│   │   ├── algorithm/page.js    # Algorithm walkthrough
│   │   ├── components/          # UI components
│   │   └── lib/
│   │       ├── inference.js     # Browser-side TFJS inference
│   │       └── viridis.js       # Viridis colormap LUT
│   └── public/tfmodel/
│       ├── model.json           # TensorFlow.js model topology
│       ├── weights.bin          # Model weights (137 KB)
│       └── samples.json         # 100 MNIST test samples (10 per digit)
└── requirements.txt
```

## Running the Application

The app has two parts: a **Python backend** (FastAPI) that runs the CNN model and a **Next.js frontend** that displays the visualizations. Both must be running simultaneously.

### Prerequisites

- conda `ml` environment (Python 3.9.7 with TensorFlow 2.19, FastAPI, Pillow, etc.)
- Node.js 18+ and npm
- MNIST dataset at `~/Downloads/mnist.pkl.gz` ([Nielsen format](https://github.com/mnielsen/neural-networks-and-deep-learning))

### 1. Backend (Terminal 1)

```bash
# From the project root
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

The backend loads the trained CNN model and MNIST test data at startup. Once running:

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Random prediction: [http://localhost:8000/api/random-predict](http://localhost:8000/api/random-predict)
- Filter by digit: [http://localhost:8000/api/random-predict?digit=7](http://localhost:8000/api/random-predict?digit=7)

**Verify it works:**

```bash
curl -s http://localhost:8000/api/random-predict | python3 -c "
import sys, json
r = json.load(sys.stdin)
print(f'Prediction: {r[\"prediction\"]}')
print(f'True label: {r[\"true_label\"]}')
print(f'Confidence scores: {len(r[\"confidence\"])}')
print(f'Activation layers: {len(r[\"activations\"])}')
"
```

### 2. Frontend (Terminal 2)

```bash
cd frontend
npm install    # first time only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend calls the backend at `localhost:8000`.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server liveness check |
| GET | `/api/random-predict` | Random MNIST image + full inference result |
| GET | `/api/random-predict?digit=N` | Random image of a specific digit (0-9) |
| POST | `/api/predict-drawing` | Inference on a user-drawn 28x28 image |
| GET | `/api/weights` | Trained filter kernels and weight matrices |

## Deploy to Vercel

The frontend deploys as a static Next.js app with no server-side requirements.

1. Push the repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Deploy

Or via CLI:

```bash
cd frontend
npx vercel
```

## Training the Model

Open `notebooks/mnist_DL_CNN.ipynb` in Jupyter. The notebook includes:

1. Environment setup (conda + ipykernel)
2. Data loading and preprocessing (MNIST, 60K train / 10K test)
3. Model architecture definition
4. Training with early stopping (~99% test accuracy)
5. Evaluation and confusion matrix
6. Layer-by-layer activation visualization
7. Weight and filter visualization

## Tech Stack

- **ML**: TensorFlow / Keras (training), TensorFlow.js (browser inference)
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Recharts
- **Backend**: FastAPI, Python 3.9+ (optional)
- **Font**: Montserrat (bundled)

## License

This project was built as a DCS Selectives educational project.
