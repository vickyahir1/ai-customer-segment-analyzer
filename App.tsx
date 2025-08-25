
import React, { useState, useCallback } from 'react';
import { DataInput } from './components/DataInput';
import { Visualization } from './components/Visualization';
import { runKMeans } from './services/kmeansService';
import { generateSegmentDescriptions } from './services/geminiService';
import type { CustomerDataPoint, Cluster } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<string>(`Annual Income (k$),Spending Score (1-100)\n15,39\n15,81\n16,6\n16,77\n17,40\n17,76\n18,6\n18,94\n19,3\n19,72\n20,14\n20,77\n21,35\n23,98\n24,73\n25,5\n28,14\n28,32\n29,77\n30,4\n33,92\n35,35\n38,91\n39,1\n40,42\n42,52\n43,36\n46,65\n48,59\n49,3\n54,49\n54,57\n59,40\n60,55\n62,75\n63,7\n65,58\n67,43\n69,91\n70,29\n71,75\n73,88\n75,5\n76,37\n78,22\n78,76\n81,93\n85,15\n86,95\n87,75\n93,90\n98,15\n101,68\n103,85\n113,91\n120,16\n126,74\n137,83`);
  const [k, setK] = useState<number>(5);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [segmentDescriptions, setSegmentDescriptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<[string, string]>(['Annual Income (k$)', 'Spending Score (1-100)']);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setClusters([]);
    setSegmentDescriptions([]);

    try {
      const lines = rawData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("Data must contain a header row and at least one data row.");
      }
      
      const headerLine = lines.shift()?.split(',') as [string, string];
      if (headerLine.length !== 2) {
        throw new Error("Header row must contain exactly two comma-separated values.");
      }
      setHeaders(headerLine);

      const parsedData: CustomerDataPoint[] = lines.map((line, index) => {
        const parts = line.split(',');
        if (parts.length !== 2) throw new Error(`Invalid data format on line ${index + 2}.`);
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (isNaN(x) || isNaN(y)) throw new Error(`Non-numeric data found on line ${index + 2}.`);
        return { x, y };
      });
      
      if (parsedData.length < k) {
        throw new Error("The number of data points must be greater than or equal to the number of clusters (K).");
      }

      const { clusters: finalClusters } = runKMeans(parsedData, k);
      setClusters(finalClusters);

      const descriptions = await generateSegmentDescriptions(finalClusters, headerLine);
      setSegmentDescriptions(descriptions);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [rawData, k]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 xl:col-span-3">
          <DataInput
            rawData={rawData}
            setRawData={setRawData}
            k={k}
            setK={setK}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <Visualization
            clusters={clusters}
            segmentDescriptions={segmentDescriptions}
            isLoading={isLoading}
            headers={headers}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
