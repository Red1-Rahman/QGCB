import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Settings, Download, Info } from 'lucide-react';

// Quantum Circuit Simulator - Fixed implementation
class QuantumCircuit {
    constructor(nQubits) {
        this.nQubits = nQubits;
        this.nStates = 2 ** nQubits;
        this.state = new Array(this.nStates).fill(0);
        this.state[0] = 1; // Initialize to |0...0⟩
        this.gates = [];
    }

    // Apply Hadamard gate - Fixed implementation
    hadamard(qubit) {
        const newState = new Array(this.nStates).fill(0);
        const h = 1 / Math.sqrt(2);

        for (let i = 0; i < this.nStates; i++) {
            const bit = (i >> qubit) & 1;
            if (bit === 0) {
                // |0⟩ -> |0⟩ + |1⟩
                const flipIdx = i | (1 << qubit);
                newState[i] += h * this.state[i];
                newState[flipIdx] += h * this.state[i];
            } else {
                // |1⟩ -> |0⟩ - |1⟩
                const flipIdx = i & ~(1 << qubit);
                newState[flipIdx] += h * this.state[i];
                newState[i] -= h * this.state[i];
            }
        }
        this.state = newState;
        this.gates.push(`H(${qubit})`);
    }

    // Apply RY rotation gate (fixed to match PennyLane)
    ry(qubit, theta) {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        const newState = new Array(this.nStates).fill(0);

        for (let i = 0; i < this.nStates; i++) {
            const bit = (i >> qubit) & 1;
            if (bit === 0) {
                const flipIdx = i | (1 << qubit);
                newState[i] += cos * this.state[i] - sin * this.state[flipIdx];
                newState[flipIdx] += sin * this.state[i] + cos * this.state[flipIdx];
            }
        }
        this.state = newState;
        this.gates.push(`RY(${qubit}, ${theta.toFixed(2)})`);
    }

    // Apply Pauli-X gate
    x(qubit) {
        const newState = new Array(this.nStates).fill(0);
        for (let i = 0; i < this.nStates; i++) {
            const flipIdx = i ^ (1 << qubit);
            newState[i] = this.state[flipIdx];
        }
        this.state = newState;
        this.gates.push(`X(${qubit})`);
    }

    // Apply controlled-X gate
    cx(control, target) {
        const newState = [...this.state];
        for (let i = 0; i < this.nStates; i++) {
            const controlBit = (i >> control) & 1;
            if (controlBit === 1) {
                const flipIdx = i ^ (1 << target);
                [newState[i], newState[flipIdx]] = [newState[flipIdx], newState[i]];
            }
        }
        this.state = newState;
        this.gates.push(`CX(${control}, ${target})`);
    }

    // Measure and return distribution
    measure(nShots = 1000) {
        const counts = {};
        const probabilities = this.state.map(amp => Math.abs(amp) ** 2);

        for (let shot = 0; shot < nShots; shot++) {
            const rand = Math.random();
            let cumProb = 0;
            for (let i = 0; i < this.nStates; i++) {
                cumProb += probabilities[i];
                if (rand <= cumProb) {
                    const bitString = i.toString(2).padStart(this.nQubits, '0');
                    counts[bitString] = (counts[bitString] || 0) + 1;
                    break;
                }
            }
        }
        return counts;
    }

    reset() {
        this.state = new Array(this.nStates).fill(0);
        this.state[0] = 1;
        this.gates = [];
    }
}

// Fixed Quantum Galton Board Circuit Generator
class QuantumGaltonBoard {
    static buildQGBCircuit(nLayers, bias = 0.5, distribution = 'gaussian') {
        const nQubits = nLayers;
        const circuit = new QuantumCircuit(nQubits);

        switch (distribution) {
            case 'gaussian':
                return this.buildGaussianQGB(circuit, nLayers);
            case 'exponential':
                return this.buildExponentialQGB(circuit, nLayers, bias);
            case 'quantum_walk':
                return this.buildQuantumWalk(circuit, nLayers);
            default:
                return this.buildGaussianQGB(circuit, nLayers);
        }
    }

    static buildGaussianQGB(circuit, nLayers) {
        // Standard QGB with Hadamard gates on each qubit
        for (let qubit = 0; qubit < nLayers; qubit++) {
            circuit.hadamard(qubit);
        }
        return circuit;
    }

    static buildExponentialQGB(circuit, nLayers, bias) {
        // Calculate exponential bias angles similar to Python version
        const decayRate = 1 - bias; // Convert bias to decay rate

        for (let layer = 0; layer < nLayers; layer++) {
            // Create increasing bias toward "0" state as we go through layers
            const probRight = Math.exp(-decayRate * (layer + 1) / nLayers);

            // Convert probability to rotation angle for RY gate
            const angle = 2 * Math.asin(Math.sqrt(probRight));
            circuit.ry(layer, angle);
        }
        return circuit;
    }

    static buildQuantumWalk(circuit, nSteps) {
        // Simplified quantum walk implementation
        const nQubits = circuit.nQubits;
        const coinQubit = nQubits - 1;

        // Initialize at center position
        if (nQubits > 1) {
            circuit.x(0);
        }

        // Perform quantum walk steps
        for (let step = 0; step < nSteps && step < nQubits; step++) {
            // Coin flip - create superposition
            circuit.hadamard(coinQubit);

            // Conditional moves based on coin state
            for (let pos = 0; pos < nQubits - 1; pos++) {
                circuit.cx(coinQubit, pos);
            }

            // Add interference
            if (step % 2 === 0 && nQubits > 2) {
                circuit.hadamard(Math.floor(nQubits / 2));
            }
        }

        return circuit;
    }

    static simulateCircuit(circuit, nShots = 1000) {
        return circuit.measure(nShots);
    }

    static processResults(counts, nQubits) {
        // Convert bit strings to bin positions (count number of 1s)
        const binCounts = {};

        for (const [bitString, count] of Object.entries(counts)) {
            const binPosition = bitString.split('').reduce((sum, bit) => sum + parseInt(bit), 0);
            binCounts[binPosition] = (binCounts[binPosition] || 0) + count;
        }

        // Create histogram data
        const histogramData = [];
        const maxBin = Math.max(...Object.keys(binCounts).map(k => parseInt(k)));

        for (let i = 0; i <= maxBin; i++) {
            histogramData.push({
                bin: i,
                quantum: binCounts[i] || 0,
                classical: 0
            });
        }

        return histogramData;
    }

    static generateClassicalDistribution(type, nBins, params = {}) {
        const data = [];
        switch (type) {
            case 'gaussian':
                const mean = params.mean || nBins / 2;
                const std = params.std || Math.sqrt(nBins / 4); // Binomial std
                for (let i = 0; i < nBins; i++) {
                    const x = i - mean;
                    const y = Math.exp(-(x * x) / (2 * std * std));
                    data.push({ bin: i, value: y });
                }
                break;
            case 'exponential':
                const lambda = params.lambda || 0.5;
                for (let i = 0; i < nBins; i++) {
                    const y = lambda * Math.exp(-lambda * i);
                    data.push({ bin: i, value: y });
                }
                break;
            case 'quantum_walk':
                const walkMean = params.mean || nBins / 2;
                const walkStd = params.std || Math.sqrt(nBins);
                for (let i = 0; i < nBins; i++) {
                    const x = i - walkMean;
                    const y = Math.exp(-(x * x) / (2 * walkStd * walkStd));
                    data.push({ bin: i, value: y });
                }
                break;
            default:
                for (let i = 0; i < nBins; i++) {
                    data.push({ bin: i, value: 0 });
                }
        }
        return data;
    }
}

const QuantumGaltonBoardApp = () => {
    const [nLayers, setNLayers] = useState(4);
    const [distribution, setDistribution] = useState('gaussian');
    const [bias, setBias] = useState(0.5);
    const [nShots, setNShots] = useState(1000);
    const [results, setResults] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [circuitGates, setCircuitGates] = useState([]);
    const [circuitInfo, setCircuitInfo] = useState(null);

    const runSimulation = async () => {
        setIsSimulating(true);

        // Add delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const circuit = QuantumGaltonBoard.buildQGBCircuit(nLayers, bias, distribution);
            const counts = QuantumGaltonBoard.simulateCircuit(circuit, nShots);

            setCircuitGates(circuit.gates);
            setCircuitInfo({
                nQubits: circuit.nQubits,
                nStates: circuit.nStates
            });

            // Process results into histogram
            const histogramData = QuantumGaltonBoard.processResults(counts, circuit.nQubits);

            // Generate classical comparison
            const classicalData = QuantumGaltonBoard.generateClassicalDistribution(
                distribution,
                histogramData.length,
                {
                    mean: histogramData.length / 2,
                    std: Math.sqrt(histogramData.length / 4),
                    lambda: 1 - bias
                }
            );

            // Normalize classical data to match quantum scale
            const maxQuantum = Math.max(...histogramData.map(d => d.quantum));
            const maxClassical = Math.max(...classicalData.map(d => d.value));
            const scale = maxQuantum > 0 ? maxQuantum / maxClassical : 1;

            histogramData.forEach((d, i) => {
                d.classical = classicalData[i] ? classicalData[i].value * scale : 0;
            });

            setResults({
                histogram: histogramData,
                totalShots: nShots,
                uniqueStates: Object.keys(counts).length,
                rawCounts: counts
            });

        } catch (error) {
            console.error('Simulation error:', error);
            // Show error state
            setResults({
                histogram: [],
                totalShots: nShots,
                uniqueStates: 0,
                error: error.message
            });
        } finally {
            setIsSimulating(false);
        }
    };

    const getDistributionDescription = () => {
        switch (distribution) {
            case 'gaussian':
                return 'Standard Quantum Galton Board using Hadamard gates on each qubit, producing a binomial distribution that approximates Gaussian for large layer counts.';
            case 'exponential':
                return `Biased Quantum Galton Board using RY rotation gates with bias=${bias.toFixed(2)}, creating exponential decay by increasing bias toward |0⟩ state in each layer.`;
            case 'quantum_walk':
                return 'Quantum walk simulation using coin flips (Hadamard gates) and controlled operations to create quantum interference patterns in position distribution.';
            default:
                return '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-indigo-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Quantum Galton Board Generator
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Simulate quantum probabilistic circuits with multiple distribution types
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700">
                    <div className="flex flex-wrap gap-6 items-center justify-between">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">Qubits/Layers</label>
                                <input
                                    type="number"
                                    min="2"
                                    max="8"
                                    value={nLayers}
                                    onChange={(e) => setNLayers(parseInt(e.target.value))}
                                    className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">Distribution</label>
                                <select
                                    value={distribution}
                                    onChange={(e) => setDistribution(e.target.value)}
                                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="gaussian">Gaussian (Standard QGB)</option>
                                    <option value="exponential">Exponential (Biased QGB)</option>
                                    <option value="quantum_walk">Quantum Walk</option>
                                </select>
                            </div>

                            {distribution === 'exponential' && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1">Bias</label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="0.9"
                                        step="0.05"
                                        value={bias}
                                        onChange={(e) => setBias(parseFloat(e.target.value))}
                                        className="w-20 accent-blue-500"
                                    />
                                    <span className="text-xs text-gray-400">{bias.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1">Shots</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="10000"
                                    step="100"
                                    value={nShots}
                                    onChange={(e) => setNShots(parseInt(e.target.value))}
                                    className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>

                            <button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                {isSimulating ? 'Simulating...' : 'Run Simulation'}
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="w-5 h-5 mt-0.5 text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-gray-300">
                                {getDistributionDescription()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {results && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Histogram */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold mb-4">Distribution Comparison</h3>
                            {results.error ? (
                                <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
                                    Error: {results.error}
                                </div>
                            ) : results.histogram.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={results.histogram}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="bin" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="quantum" fill="#3B82F6" name="Quantum Results" />
                                        <Bar dataKey="classical" fill="#EF4444" name="Classical Comparison" opacity={0.6} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-400 p-4">No data to display</div>
                            )}
                        </div>

                        {/* Circuit Info */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-semibold mb-4">Circuit Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-300 mb-2">Statistics</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Total Shots:</span>
                                            <span className="ml-2 font-mono">{results.totalShots}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Unique States:</span>
                                            <span className="ml-2 font-mono">{results.uniqueStates}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Qubits Used:</span>
                                            <span className="ml-2 font-mono">{circuitInfo?.nQubits || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Layers/Steps:</span>
                                            <span className="ml-2 font-mono">{nLayers}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-300 mb-2">Circuit Gates</h4>
                                    <div className="bg-gray-900/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        <div className="space-y-1 text-sm font-mono">
                                            {circuitGates.length > 0 ? (
                                                circuitGates.map((gate, i) => (
                                                    <div key={i} className="text-gray-300">
                                                        {i + 1}. {gate}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500">No gates applied</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {results.rawCounts && (
                                    <div>
                                        <h4 className="font-medium text-gray-300 mb-2">Raw Measurement Results</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                                            <div className="space-y-1 text-xs font-mono">
                                                {Object.entries(results.rawCounts).slice(0, 10).map(([state, count]) => (
                                                    <div key={state} className="text-gray-300">
                                                        |{state}⟩: {count}
                                                    </div>
                                                ))}
                                                {Object.keys(results.rawCounts).length > 10 && (
                                                    <div className="text-gray-500">... and {Object.keys(results.rawCounts).length - 10} more</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Panel */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
                            <h3 className="text-xl font-semibold mb-4">Advanced Settings</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Circuit Implementation</label>
                                    <p className="text-sm text-gray-400">
                                        Uses state vector simulation with proper quantum gate operations. The exponential distribution uses RY gates with calculated bias angles.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Measurement Process</label>
                                    <p className="text-sm text-gray-400">
                                        Results are processed by counting the number of |1⟩ states in each measurement, creating a binomial-like distribution.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-gray-400 text-sm">
                    <p>
                        Quantum Galton Board Generator - Corrected implementation based on quantum circuit principles
                    </p>
                    <p className="mt-2">
                        Built with React and custom quantum circuit simulation matching PennyLane behavior
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuantumGaltonBoardApp;