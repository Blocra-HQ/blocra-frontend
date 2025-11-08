import { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface TransactionTypesChartProps {
  endpoints: string[];
}

export function TransactionTypesChart({ endpoints }: TransactionTypesChartProps) {
  const [data, setData] = useState([
    { name: "Transfers", value: 0 },
    { name: "DeFi", value: 0 },
    { name: "NFT", value: 0 },
    { name: "Gaming", value: 0 },
    { name: "Other", value: 0 }
  ]);
  const [status, setStatus] = useState("Loading...");
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let latestBlock = 700000;
        
        // Try to get latest block
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'starknet_blockNumber',
                params: [],
                id: Date.now()
              })
            });
            
            if (response.ok) {
              const blockData = await response.json();
              if (blockData.result) {
                latestBlock = parseInt(blockData.result, 16);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // Try multiple endpoints for block data
        const blocks = [];
        for (let i = 0; i < 3; i++) {
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'starknet_getBlockWithTxs',
                  params: [{ block_number: latestBlock - i }],
                  id: Date.now() + i
                })
              });
              
              if (response.ok) {
                const blockData = await response.json();
                if (blockData.result && !blockData.error) {
                  blocks.push(blockData.result);
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        // Analyze transaction types
        const txTypes = { transfers: 0, defi: 0, nft: 0, gaming: 0, other: 0 };
        let totalTxs = 0;
        
        blocks.forEach(block => {
          block.transactions?.forEach(tx => {
            totalTxs++;
            const calldataStr = JSON.stringify(tx.calldata || []).toLowerCase();
            
            if (calldataStr.includes('transfer') || calldataStr.includes('send')) {
              txTypes.transfers++;
            } else if (calldataStr.includes('swap') || calldataStr.includes('liquidity') || calldataStr.includes('pool')) {
              txTypes.defi++;
            } else if (calldataStr.includes('mint') || calldataStr.includes('token_id') || calldataStr.includes('nft')) {
              txTypes.nft++;
            } else if (calldataStr.includes('game') || calldataStr.includes('play') || calldataStr.includes('battle')) {
              txTypes.gaming++;
            } else {
              txTypes.other++;
            }
          });
        });
        
        if (totalTxs > 0) {
          const newData = [
            { name: "Transfers", value: Math.round((txTypes.transfers / totalTxs) * 100) },
            { name: "DeFi", value: Math.round((txTypes.defi / totalTxs) * 100) },
            { name: "NFT", value: Math.round((txTypes.nft / totalTxs) * 100) },
            { name: "Gaming", value: Math.round((txTypes.gaming / totalTxs) * 100) },
            { name: "Other", value: Math.round((txTypes.other / totalTxs) * 100) }
          ];
          
          setData(newData);
          setHasData(true);
          setStatus(`Analyzed ${totalTxs} transactions`);
        } else {
          throw new Error('No transaction data');
        }
        
      } catch (error) {
        console.warn('Transaction types fetch failed, using mock data:', error);
        setStatus('Using Mock Data');
        setHasData(false);
        
        // Generate realistic mock data that changes over time
        const baseTime = Math.floor(Date.now() / 60000); // Changes every minute
        const mockData = [
          { name: "Transfers", value: 40 + (baseTime % 10) },
          { name: "DeFi", value: 25 + (baseTime % 8) },
          { name: "NFT", value: 15 + (baseTime % 6) },
          { name: "Gaming", value: 10 + (baseTime % 4) },
          { name: "Other", value: 10 + (baseTime % 3) }
        ];
        
        setData(mockData);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [endpoints]);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Transaction Types</h3>
        <span className="text-sm text-muted-foreground">{status}</span>
      </div>
      
      {!hasData && (
        <div className="text-xs text-yellow-600 mb-2 p-2 bg-yellow-50 rounded">
          ⚠️ No real transaction data available - showing mock data
        </div>
      )}
      
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}