interface ContractNode {
  id: string;
  address: string;
  name: string;
  type: string;
  interactions: number;
}

interface ContractEdge {
  source: string;
  target: string;
  weight: number;
  type: 'call' | 'transfer' | 'approval';
}

export class DependencyGraphService {
  static buildDependencyGraph(contracts: any[], events: any[]) {
    const nodes: ContractNode[] = contracts.map(contract => ({
      id: contract.address,
      address: contract.address,
      name: contract.name || 'Unknown',
      type: contract.contractType || 'Contract',
      interactions: 0
    }));

    const edges: ContractEdge[] = [];
    const edgeMap = new Map<string, ContractEdge>();

    // Analyze events for cross-contract interactions
    events.forEach(event => {
      const fromContract = event.from || event.decoded_data?.from;
      const toContract = event.to || event.decoded_data?.to;
      
      if (fromContract && toContract && fromContract !== toContract) {
        const edgeKey = `${fromContract}-${toContract}`;
        
        if (edgeMap.has(edgeKey)) {
          edgeMap.get(edgeKey)!.weight++;
        } else {
          edgeMap.set(edgeKey, {
            source: fromContract,
            target: toContract,
            weight: 1,
            type: this.getInteractionType(event)
          });
        }
      }
    });

    // Update interaction counts
    edgeMap.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode) sourceNode.interactions += edge.weight;
      if (targetNode) targetNode.interactions += edge.weight;
      
      edges.push(edge);
    });

    return {
      nodes: nodes.filter(n => n.interactions > 0),
      edges,
      metrics: this.calculateGraphMetrics(nodes, edges)
    };
  }

  private static getInteractionType(event: any): 'call' | 'transfer' | 'approval' {
    if (event.event_name === 'Transfer') return 'transfer';
    if (event.event_name === 'Approval') return 'approval';
    return 'call';
  }

  private static calculateGraphMetrics(nodes: ContractNode[], edges: ContractEdge[]) {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;
    
    // Find most connected contract
    const mostConnected = nodes.reduce((max, node) => 
      node.interactions > max.interactions ? node : max, nodes[0]);
    
    // Calculate centrality scores
    const centralityScores = nodes.map(node => ({
      address: node.address,
      score: node.interactions / Math.max(1, totalEdges)
    }));

    return {
      totalNodes,
      totalEdges,
      density: density.toFixed(3),
      mostConnected: mostConnected?.address || 'None',
      centralityScores
    };
  }

  static generateFlowDiagram(graph: any) {
    // Generate mermaid diagram syntax
    let diagram = 'graph TD\n';
    
    graph.nodes.forEach((node: ContractNode) => {
      const shortAddr = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`;
      diagram += `  ${node.id}[${node.name}<br/>${shortAddr}]\n`;
    });
    
    graph.edges.forEach((edge: ContractEdge) => {
      const style = edge.type === 'transfer' ? '-->' : 
                   edge.type === 'approval' ? '-..->' : '-->';
      diagram += `  ${edge.source} ${style} ${edge.target}\n`;
    });
    
    return diagram;
  }
}