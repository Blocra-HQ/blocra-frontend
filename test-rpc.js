
const RPC_ENDPOINTS = [
    'https://rpc.starknet.lava.build',
    'https://starknet-mainnet.g.alchemy.com/v2/demo',
];

async function checkEndpoint(endpoint) {
    console.log(`Checking ${endpoint}...`);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'starknet_chainId',
                params: []
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`Success! Chain ID: ${data.result}`);
            return true;
        } else {
            console.log(`Failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error connecting to ${endpoint}:`, error.message);
    }
    return false;
}

async function run() {
    for (const endpoint of RPC_ENDPOINTS) {
        await checkEndpoint(endpoint);
    }
}

run();
