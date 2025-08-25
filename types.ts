
export interface CustomerDataPoint {
  x: number;
  y: number;
}

export interface ClusteredPoint extends CustomerDataPoint {
  cluster: number;
}

export interface Centroid extends CustomerDataPoint {}

export interface Cluster {
  centroid: Centroid;
  points: CustomerDataPoint[];
}
