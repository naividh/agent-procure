export interface ServiceEndpoint {
      path: string; method: string; price: string; description: string; params: Record<string, string>;
      }
      export interface ServiceInfo {
        service: string; name: string; description: string; baseUrl: string; endpoints: ServiceEndpoint[];
        }

        export async function discoverServices(serviceUrls: string[]): Promise<ServiceInfo[]> {
          const services: ServiceInfo[] = [];
            for (const baseUrl of serviceUrls) {
                try {
                      const res = await fetch(baseUrl + "/api/discover");
                            if (res.ok) { const info = await res.json(); services.push({ ...info, baseUrl }); }
                                } catch { console.warn("Could not discover service at " + baseUrl); }
                                  }
                                    return services;
                                    }

                                    export function rankEndpointsByRelevance(services: ServiceInfo[], query: string) {
                                      const keywords = query.toLowerCase().split(/\s+/);
                                        const ranked: Array<{ service: ServiceInfo; endpoint: ServiceEndpoint; relevanceScore: number }> = [];
                                          for (const service of services) {
                                              for (const endpoint of service.endpoints) {
                                                    let score = 0;
                                                          const text = (service.name + " " + service.description + " " + endpoint.description).toLowerCase();
                                                                for (const kw of keywords) { if (text.includes(kw)) score += 1; }
                                                                      if (endpoint.path.includes("deep") || endpoint.path.includes("competitor")) score += 0.5;
                                                                            if (score > 0) ranked.push({ service, endpoint, relevanceScore: score });
                                                                                }
                                                                                  }
                                                                                    if (ranked.length === 0) {
                                                                                        for (const service of services) {
                                                                                              for (const endpoint of service.endpoints) {
                                                                                                      ranked.push({ service, endpoint, relevanceScore: 0.1 });
                                                                                                            }
                                                                                                                }
                                                                                                                  }
                                                                                                                    return ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
                                                                                                                    }
}