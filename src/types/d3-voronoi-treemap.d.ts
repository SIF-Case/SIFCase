declare module "d3-voronoi-treemap" {
  export function voronoiTreemap(): {
    clip(polygon: [number, number][]): typeof this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (root: any): void;
  };
}
