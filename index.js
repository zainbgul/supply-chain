// Check if MetaMask is installed
if (typeof window.ethereum === "undefined") {
  document.getElementById("status").innerText =
    "MetaMask is not installed. Please install it to use this DApp.";
}

let provider;
let signer;
let contract;

// Update with your deployed SupplyChain contract address on Sepolia
const contractAddress = "0x448625192D39c49E40B7Dab354eba6c8a5067e5e";

// Updated ABI including the SupplyChain functions and the isAdmin function
const contractABI = [
  {
    "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
    "name": "addProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_productId", "type": "uint256" },
      { "internalType": "address", "name": "_newOwner", "type": "address" }
    ],
    "name": "transferProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_productId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "addProductEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_productId", "type": "uint256" }],
    "name": "getProductEvents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct SupplyChain.ProductEvent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "productCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // New isAdmin function for checking admin status
  {
    "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }],
    "name": "isAdmin",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function connectWallet() {
  try {
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    document.getElementById("walletAddress").innerText = "Connected: " + address;
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    // Debug: Log the contract instance to verify available functions
    console.log("Contract instance:", contract);
    document.getElementById("status").innerText = "Wallet connected. Contract loaded.";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Error connecting wallet: " + error.message;
  }
}

document.getElementById("connectButton").addEventListener("click", connectWallet);

document.getElementById("addProductButton").addEventListener("click", async () => {
  const productName = document.getElementById("productName").value.trim();
  if (!productName) {
    return alert("Enter a product name.");
  }
  // Check admin status using isAdmin
  try {
    const currentAddress = await signer.getAddress();
    const isAdmin = await contract.isAdmin(currentAddress);
    if (!isAdmin) {
      return alert("You are not authorized to add a product. Admin required.");
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    return alert("Unable to verify admin status.");
  }
  document.getElementById("status").innerText = "Adding product...";
  try {
    const tx = await contract.addProduct(productName, { gasLimit: 500000 });
    await tx.wait();
    document.getElementById("status").innerText = "Product added successfully.";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Error: " + error.message;
  }
});

document.getElementById("transferProductButton").addEventListener("click", async () => {
  const productId = document.getElementById("transferProductId").value;
  const newOwner = document.getElementById("newOwner").value.trim();
  if (!productId || !newOwner) {
    return alert("Fill in both fields.");
  }
  document.getElementById("status").innerText = "Transferring ownership...";
  try {
    const tx = await contract.transferProduct(productId, newOwner, { gasLimit: 500000 });
    await tx.wait();
    document.getElementById("status").innerText = "Ownership transferred.";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Error: " + error.message;
  }
});

document.getElementById("addEventButton").addEventListener("click", async () => {
  const productId = document.getElementById("eventProductId").value;
  const eventDesc = document.getElementById("eventDescription").value.trim();
  if (!productId || !eventDesc) {
    return alert("Fill in both fields.");
  }
  document.getElementById("status").innerText = "Adding event...";
  try {
    const tx = await contract.addProductEvent(productId, eventDesc, { gasLimit: 500000 });
    await tx.wait();
    document.getElementById("status").innerText = "Event added.";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Error: " + error.message;
  }
});

document.getElementById("getEventsButton").addEventListener("click", async () => {
  const productId = document.getElementById("getEventsProductId").value;
  if (!productId) {
    return alert("Enter a product ID.");
  }
  document.getElementById("status").innerText = "Fetching events...";
  try {
    const events = await contract.getProductEvents(productId);
    let output = `<h3>Events for Product ${productId}</h3>`;
    if (events.length === 0) {
      output += "<p>No events found.</p>";
    } else {
      events.forEach((ev, index) => {
        const date = new Date(ev.timestamp.toNumber() * 1000).toLocaleString();
        output += `<p>Event ${index + 1}: ${ev.description} at ${date}</p>`;
      });
    }
    document.getElementById("eventsOutput").innerHTML = output;
    document.getElementById("status").innerText = "Events fetched.";
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Error: " + error.message;
  }
});