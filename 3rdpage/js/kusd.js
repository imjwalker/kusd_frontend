/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable indent */


const addressBtn = document.getElementById("addressBtn");
const notificationBox = document.getElementById('notificationBox');
const tvlBox = document.getElementById('displayTVL');

let submitTextEl = document.getElementById('submitText');
let canBroadcast = false;

let lastClickedButton = null;
let activeButton = null;
let connectedAccount;

let koinBalance = 0;
let ethBalance = 0;
let btcBalance = 0;
let kasBalance = 0;
let kgBalance = 0;
let ksBalance = 0;
let kgCV = 0;
let ksCV = 0;
let kgCR = 0;
let ksCR = 0;

let tvl = 0;
let kgTVL = 0;
let ksTVL = 0;
let kgSupply = 0;
let ksSupply = 0;
let kgGCR = 0;
let ksGCR = 0;

let kgContract;
let ksContract;

let kapPrice = 0;
let koinPrice = 0;
let ethPrice = 0;
let btcPrice = 0;
let kasPrice = 0;
let kPrice = 0;

let vaultCount = 0;
let kgVaults = [];
let ksVaults = [];


function greet() {
  console.log('hello');
}

async function displayTVL() {

  kgContract = new Contract({
    id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
    abi: utils.tokenAbi,
    provider: kondor.provider,
  }).functions;

  ksContract = new Contract({
    id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
    abi: utils.tokenAbi,
    provider: kondor.provider,
  }).functions;
  
  await getPrices();
  await getVaultsInfo();
  getProtocolStats();
  console.log(tvl);
  tvlBox.textContent = `Total Value Locked: $${formatBalance(tvl, 2)}`;
  tvlBox.classList.add('visible');
}


//// Connect and disconnect functionality ////
async function connect() {

  
    if (connectedAccount == undefined) {
      await getAccounts();

      if (connectedAccount !== undefined) {
        document.getElementById('launchSection').style.display = 'none';
        document.getElementById('uiBar').style.display = 'block';
        document.getElementById('myVaultBox').style.display = 'block';

        addressBtn.firstChild.textContent = `${connectedAccount}`;
        addressBtn.addEventListener('click', () => {
          window.open(`https://koiner.app/addresses/${connectedAccount}`, '_blank');
        })
      }
    }
}

async function disconnect() {
    connectedAccount = undefined;
    resetBalances();
    resetProtocolStats();
    updateProtocolStats();

    document.getElementById('launchSection').style.display = 'flex';
    document.getElementById('uiBar').style.display = 'none';
    document.getElementById('myVaultBox').style.display = 'none';
    document.getElementById('protocolBox').style.display = 'none';
    document.getElementById('vaultsBox').style.display = 'none';
}

async function getAccounts() {
    try {
      const accounts = await kondor.getAccounts();

      document.getElementById('loadingSquare').hidden = false;
      connectedAccount = accounts[0].address;

      kgContract = new Contract({
        id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
        abi: utils.tokenAbi,
        provider: kondor.provider,
      }).functions;

      ksContract = new Contract({
        id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
        abi: utils.tokenAbi,
        provider: kondor.provider,
      }).functions;
      
      await getPrices();
      getVaultBalances();

      await getVaultsInfo();
      displayVaults();

      getProtocolStats();
      updateProtocolStats();

      document.getElementById('loadingSquare').hidden = true;

    } catch (error) {
      console.error(error);
    }
}

//// UI functions ////

// Initialize action buttons
const actionButtons = document.querySelectorAll('.actionBtn');
actionButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (lastClickedButton === button) {
        actionBox.classList.add('hidden');
        button.classList.remove('bg-gray-400');
        button.classList.add('bg-black');
        lastClickedButton = null;
        submitTextEl.textContent = '';
        document.getElementById('amount').value = '';
        
      } else {
        updateActionBox(button.id);
        highlightButton(button);
        actionBox.classList.remove('hidden');
        lastClickedButton = button;
        submitTextEl.textContent = '';
        document.getElementById('amount').value = '';
      }
    });
});

// Toggle the action box
function updateActionBox(buttonId) {
    const actionBox = document.getElementById('actionBox');
    const typeSelect = document.getElementById('token');
    actionBox.classList.remove('hidden');
    typeSelect.innerHTML = '<option value="" disabled selected>Select Type</option>';
    if (buttonId === 'depositBtn' || buttonId === 'withdrawBtn') {
      const options = ['KOIN', 'ETH', 'BTC', 'KAS'];
      options.forEach(option => {
          typeSelect.innerHTML += `<option value="${option}">${option}</option>`;
      });
    } else if (buttonId === 'mintBtn' || buttonId === 'repayBtn') {
      const options = ['KUSDG', 'KUSDS'];
      options.forEach(option => {
          typeSelect.innerHTML += `<option value="${option}">${option}</option>`;
      });
    }
}

// Highlight the active button
function highlightButton(button) {
    if (activeButton) {
        activeButton.classList.remove('bg-gray-400');
        activeButton.classList.add('bg-black');
    }
    button.classList.remove('bg-black');
    button.classList.add('bg-gray-400');
    activeButton = button;
}

// Handle submit action
document.getElementById('submitAction').addEventListener('click', () => {
    const token = document.getElementById('token').value;
    const amount = document.getElementById('amount').value;

    if (canBroadcast == true && !isNaN(amount) && amount !== '' && (token == 'KOIN' || token == 'ETH' || token == 'BTC' || token == 'KAS')) {
      switch(activeButton) {
        case document.getElementById("depositBtn"):
          manageVault("deposit", token, amount);
          break;
        case document.getElementById("mintBtn"):
          manageVault("mint", token, amount);
          break;
        case document.getElementById("withdrawBtn"):
          manageVault("withdraw", token, amount);
          break;
        case document.getElementById("repayBtn"):
          manageVault("repay", token, amount);
          break;  
      }
    }
});

document.getElementById('amount').addEventListener('input', checkInput);
document.getElementById('token').addEventListener('change', checkInput);

function checkInput() {
  let amountValue = document.getElementById('amount').value;
  let tokenValue = document.getElementById('token').value;
  submitTextEl.textContent = '';

  if (activeButton == document.getElementById('depositBtn')) {
    if (amountValue !== "" && !isNaN(amountValue) && tokenValue !== "" ) {
      submitTextEl.textContent = `Deposit fee (0.3%): ${parseFloat((amountValue * 0.003).toFixed(6))} ${tokenValue}`;
      canBroadcast = true;
    } else {
      canBroadcast = false;
    }
  } 

  if (activeButton == document.getElementById('withdrawBtn')){
    if (
      tokenValue == 'KOIN' && amountValue > koinBalance || 
      tokenValue == 'ETH' && amountValue > ethBalance ||
      tokenValue == 'BTC' && amountValue > btcBalance ||
      tokenValue == 'KAS' && amountValue > kasBalance) {
        submitTextEl.textContent = 'Exceeds withdrawal limit';
        canBroadcast = false;
    } else {
      canBroadcast = true;
    }
  }

  if (activeButton == document.getElementById('mintBtn')) {
    submitTextEl.textContent = `Minimum amount to mint is 1 ${tokenValue}`;
    if (tokenValue == 'KUSDG' && (kgBalance + parseFloat(amountValue)) * 1.10 > kgCV) {
      submitTextEl.textContent = 'Exceeds 110% collateral ratio limit';
      canBroadcast = false;
    } else if (amountValue < 1) {
      submitTextEl.textContent = `Minimum amount to mint is 1 ${tokenValue}`;
      canBroadcast = false;
    } else {
      canBroadcast = true;
    }
  }

  if (activeButton == document.getElementById('repayBtn')) {
    submitTextEl.textContent = `Minimum amount to repay is 1 ${tokenValue}`;
    if (tokenValue == 'KUSDG' && amountValue > kgBalance || tokenValue == 'KUSDS' && amountValue > ksBalance) {
      submitTextEl.textContent = 'Exceeds repay limit';
      canBroadcast = false;
    } else if (amountValue < 1) {
      submitTextEl.textContent = `Minimum amount to repay is 1 ${tokenValue}`;
      canBroadcast = false;
    } else {
      canBroadcast = true;
    }
  }
}

// Show notification box after a transaction has been sent
function showNotification(notificationText) {
    notificationBox.classList.remove('hidden');
    notificationBox.classList.add('opacity-100');
    document.getElementById("notificationText").textContent = notificationText;
}

//// Update interface functionality ////

function resetBalances() {

    koinBalance = 0;
    ethBalance = 0;
    btcBalance = 0;
    kasBalance = 0;
    kgBalance = 0;
    ksBalance = 0;
    kgCV = 0;
    ksCV = 0;
    kgCR = 0;
    ksCR = 0;

    updateBalances();
}

function updateBalances() {
    document.getElementById('koinBalance').textContent = parseFloat(koinBalance.toFixed(4));
    document.getElementById('kusdgBalance').textContent = parseFloat(kgBalance.toFixed(2));

    document.getElementById('ethBalance').textContent = parseFloat(ethBalance.toFixed(6));
    document.getElementById('btcBalance').textContent = parseFloat(btcBalance.toFixed(8));
    document.getElementById('kasBalance').textContent = parseFloat(kasBalance.toFixed(4));
    document.getElementById('kusdsBalance').textContent = parseFloat(ksBalance.toFixed(2));

    (kgBalance == 0) ? kgCR = " - " : kgCR = (kgCV / kgBalance * 100).toFixed(2); 
    (ksBalance == 0) ? ksCR = " - " : ksCR = (ksCV / ksBalance * 100).toFixed(2); 

    document.getElementById("kusdgCV").textContent = `$ ${kgCV.toFixed(2)}`;
    document.getElementById("kusdsCV").textContent = `$ ${ksCV.toFixed(2)}`;
    document.getElementById("kusdgCR").textContent = `${kgCR}%`;
    document.getElementById("kusdsCR").textContent = `${ksCR}%`;
}

function formatBalance(num, decimals) {
    return num.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function resetProtocolStats() {
    tvl = 0;
    kgTVL = 0;
    ksTVL = 0;
    kgSupply = 0;
    ksSupply = 0;
    kgGCR = 0;
    ksGCR = 0;
    vaultCount = 0;
    kgVaults = [];
    ksVaults = [];
}

async function updateProtocolStats() {
    document.getElementById("kusdgSupply").textContent = formatNum(kgSupply);
    document.getElementById("kusdsSupply").textContent = formatNum(ksSupply);
    document.getElementById("vaultCount").textContent = vaultCount;

    (kgSupply == 0) ? kgGCR = " - " : kgGCR = (kgTVL / kgSupply * 100).toFixed(2);
    (ksSupply == 0) ? ksGCR = " - " : ksGCR = (ksTVL / ksSupply * 100).toFixed(2);
    document.getElementById('kusdgCollateralRatio').textContent = `${kgGCR}%`;
    document.getElementById('kusdsCollateralRatio').textContent = `${ksGCR}%`;
    
    document.getElementById('totalTVL').textContent = `$${formatNum(tvl)}`;
}

function formatNum(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// get asset prices from KoinDX (currently with price object workaround)
async function getPrices() {
    // get KAP oracle
    try {
      const kapContract = new Contract({
          id: "13PXvxWLMyi4dAd6uS1SehNNFryvFyygnD",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await kapContract.get_kap_price({
          tokenAddress: '1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH'
      });
      kapPrice = result.price / 100000000;
      console.log('KAP price: ', kapPrice);
    
    } catch (error) {
      console.log(error);
    }
    // get KoinDX KOIN price
    try {
      const priceObjects = new Contract({
          id: "15EDfz9ZdepDSV1ERoe8LXN9dvT7X7qMk1",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await priceObjects.get_my_price({
        tokenAddress: '1PWNYq8aF6rcKd4of59FEeSEKmYifCyoJc'
      });
      koinPrice = result.token_b / result.token_a;
      console.log('KOIN price: ', koinPrice);
    
    } catch (error) {
      console.log(error);
    }

    // get KoinDX ETH price --> priceObjects instead
    try {
      const priceObjects = new Contract({
          id: "15EDfz9ZdepDSV1ERoe8LXN9dvT7X7qMk1",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await priceObjects.get_my_price({
         tokenAddress: '17mY5nkRwW4cpruxmavBaTMfiV3PUC8mG7'
      });
      ethPrice = result.token_b / result.token_a;
      console.log('ETH price: ', ethPrice);
    
    } catch (error) {
      console.log(error);
    }
    // get KoinDX BTC price ----> price objects instead
    try {
      const priceObjects = new Contract({
          id: "15EDfz9ZdepDSV1ERoe8LXN9dvT7X7qMk1",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await priceObjects.get_my_price({
        tokenAddress: '1PMyipr6DmecFezR3Z6wLheNznK76yuSat'
      });
      btcPrice = result.token_b / result.token_a;
      console.log('BTC price: ', btcPrice);
    
    } catch (error) {
      console.log(error);
    }
    // get KoinDX KAS price -----> price objects instead
    try {
      const priceObjects = new Contract({
          id: "15EDfz9ZdepDSV1ERoe8LXN9dvT7X7qMk1",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await priceObjects.get_my_price({
        tokenAddress: '1Nu8U85SLvLHimTYLGVH2Qha5uoDuWm6mm'
      });
      kasPrice = result.token_b / result.token_a;
      console.log('KAS price: ', kasPrice);
    
    } catch (error) {
      console.log(error);
    }
}


// initialize protocol statistics
async function getProtocolStats() {
    let totalKoin = 0;
    let totalEth = 0;
    let totalBtc = 0;
    let totalKas = 0;

    (koinPrice > kapPrice) ? kPrice = koinPrice : kPrice = kapPrice;

    kgVaults.forEach(vault => {
        vaultCount++;
        console.log(vault[1]);
        totalKoin += +vault[1].koin || 0;
        kgSupply += +vault[1].kusdgold || 0;
    });

    ksVaults.forEach(vault => {
        vaultCount++;
        console.log(vault[1]);
        totalEth += +vault[1].eth || 0;
        totalBtc += +vault[1].btc || 0;
        totalKas += +vault[1].kas || 0;
        ksSupply += +vault[1].kusdsilver || 0;
    });

    totalKoin ? kgTVL = (totalKoin / 100000000 * kPrice) : kgTVL = 0;
    tvl += kgTVL;

    totalEth ? ksTVL += (totalEth / 100000000 * ethPrice) : ksTVL;
    totalBtc ? ksTVL += (totalBtc / 100000000 * btcPrice) : ksTVL;
    totalKas ? ksTVL += (totalKas / 100000000 * kasPrice) : ksTVL;
    tvl += ksTVL;

    isNaN(kgSupply) ? kgSupply = 0 : kgSupply /= 100000000;
    isNaN(ksSupply) ? ksSupply = 0 : ksSupply /= 100000000;
}


//// Smart contract functionality ////

// get data from all vaults
async function getVaultsInfo() {
    const operations = [
      { contract: kgContract, getVaults: 'kgGetVaults', getBalances: 'kgGetBalances', vaults: kgVaults },
      { contract: ksContract, getVaults: 'ksGetVaults', getBalances: 'ksGetBalances', vaults: ksVaults }
    ];
  
    for (let { contract, getVaults, getBalances, vaults } of operations) {
      try {
        let { operation, result } = await contract[getVaults]({ limit: 1000 });
        if (result) vaults.push(...result.accounts.map(account => [account]));
  
        ({ result } = await contract[getBalances]({ limit: 1000 }));
        if (result) result.kvb.forEach((balance, i) => vaults[i].push(balance));
        
      } catch (error) {
        console.log(error);
      }
    }
}

// Get the balances of the user's vault
async function getVaultBalances() { // usd value contract call nog aanpassen
    // get KUSDG, KOIN balances
    try {
      const { operation, result } = await kgContract.kgGetVault({
        owner: connectedAccount,
      })
      if (result == undefined) {
        koinBalance = 0, kgBalance = 0, kgCV = 0;
      } else {
        result.koin == undefined ? koinBalance = 0 : koinBalance = result.koin / 100000000;
        result.kusdgold == undefined ? kgBalance = 0 : kgBalance = result.kusdgold / 100000000;

        (koinPrice > kapPrice) ? kPrice = koinPrice : kPrice = kapPrice;
        kgCV = koinBalance * kPrice;
      }
    } catch (error) {
      console.error(error);
    }
    // get KUSDS, ETH, BTC, KAS balances
    try {
      const { operation, result } = await ksContract.ksGetVault({
        owner: connectedAccount,
      })
      if (result == undefined) {
        ethBalance = 0, btcBalance = 0, kasBalance = 0, ksBalance = 0, ksCV = 0;
      } else {
        result.eth == undefined ? ethBalance = 0 : ethBalance = result.eth / 100000000;
        result.btc == undefined ? btcBalance = 0 : btcBalance = result.btc / 100000000;
        result.kas == undefined ? kasBalance = 0 : kasBalance = result.kas / 100000000;
        result.kusdsilver == undefined ? ksBalance = 0 : ksBalance = result.kusdsilver / 100000000;
        ksCV = ethBalance * ethPrice + btcBalance * btcPrice + kasBalance * kasPrice;
      }
    } catch (error) {
      console.error(error);
    }
    updateBalances();
}

// Send a transaction
async function manageVault(action, token, amount) {
    console.log(action, token, amount);
    
    const contractDetails = {
        KUSDG: { id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT", functions: { deposit: "kgDeposit", withdraw: "kgWithdraw", mint: "kgMint", repay: "kgRepay" } },
        KUSDS: { id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ", functions: { deposit: "ksDeposit", withdraw: "ksWithdraw", mint: "ksMint", repay: "ksRepay" }, collateralID: { ETH: 0, BTC: 1, KAS: 2 } }
    };
    
    const { id, functions, collateralID } = contractDetails[token === "KOIN" || token === "KUSDG" ? "KUSDG" : "KUSDS"];
    const contract = new Contract({ id, abi: utils.tokenAbi, provider: kondor.provider, signer: kondor.getSigner(connectedAccount) }).functions;
    
    try {
        const params = { account: connectedAccount, amount: utils.parseUnits(amount, 8) };
        if (collateralID) params.collateral = collateralID[token];
        if (action === "deposit" || action === "withdraw") params.fee = 3, params.fee_address = "1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH";
        const { transaction, receipt } = await contract[functions[action]](params);

        await log(transaction, receipt);
        getVaultBalances();
        await resetProtocolStats();
        await getVaultsInfo();
        await getProtocolStats();
        updateProtocolStats();
        displayVaults();

    } catch (error) {
         console.error(error);
    }
}
    

async function liquidate(type, vaultAddress) {
    try {
        const contractId = type == 'KUSDG' ? "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT" : "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ";
        const contractFunction = type == 'KUSDG' ? 'kgLiquidate' : 'ksLiquidate';

        const contract = new Contract({
            id: contractId,
            abi: utils.tokenAbi,
            provider: kondor.provider,
            signer: kondor.getSigner(connectedAccount),
        }).functions;

        const { transaction, receipt } = await contract[contractFunction]({
            account: connectedAccount,
            vault: vaultAddress
        });
        await log(transaction, receipt);

    } catch (error) {
        console.log(error);
    }
}

// Show notification
async function log(transaction, receipt) {
    if (receipt.logs) throw new Error(receipt.logs.join(", "));
    showNotification(`transaction ${transaction.id} submitted. Waiting to be mined`);

    const blockNumber = await transaction.wait();
    showNotification(`transaction ${transaction.id} submitted. Mined in block ${blockNumber}`);

    setTimeout(() => {
          notificationBox.classList.remove('opacity-100');
          notificationBox.classList.add('opacity-0');
          setTimeout(() => {
              notificationBox.classList.add('hidden');
          }, 300);
      }, 3000);
}


//// Risky Vaults functionality ////
function displayVaults() {
    resetVaults();
    let vaultList = [], kPrice = Math.max(koinPrice, kapPrice);

    [...kgVaults, ...ksVaults].forEach(vault => {
        let { koin, kusdgold, kusdsilver, eth, btc, kas } = vault[1];
        let vaultCollateral = (!isNaN(+koin) ? koin / 100000000 * kPrice : 0) +
                              (!isNaN(+eth) ? eth / 100000000 * ethPrice : 0) +
                              (!isNaN(+btc) ? btc / 100000000 * btcPrice : 0) +
                              (!isNaN(+kas) ? kas / 100000000 * kasPrice : 0);
        let collTypes = [koin && 'KOIN', eth && 'ETH', btc && 'BTC', kas && 'KAS'].filter(Boolean);
        let kusdType = kusdgold ? kusdgold : kusdsilver;
        let collRatio = vaultCollateral / (kusdType / 100000000) * 100;

        if (kusdgold || kusdsilver) {
            vaultList.push([vault[0], kusdType / 100000000, kusdgold ? 'KUSDG' : 'KUSDS', collRatio.toFixed(2), collTypes]);
        }
    });
    vaultList.sort((a, b) => a[3] - b[3]);
    vaultList.forEach(element => addVault(...element));
}

function addVault(address, debt, type, collRatio, collTypes) {
    const vaultHook = document.getElementById('vaultHook');
    const newChild = document.createElement('div');
    newChild.className = 'flex justify-between items-center';
    newChild.id = `${address}`;

    const addressDiv = document.createElement('div');
    addressDiv.style.width = '120px';
    addressDiv.className = 'text-gray-600 font-medium';
    addressDiv.textContent = address.slice(0,5) + '...' + address.slice(-4);

    const collDiv = document.createElement('div');
    collDiv.style.width = '100px';
    collDiv.className = 'text-gray-600 font-medium';
    if (collTypes) {
      collDiv.textContent = collTypes.join(", ");
    } 
    
    const debtDiv = document.createElement('div');
    debtDiv.style.width = '120px';
    debtDiv.className = 'text-gray-600 font-medium';
    debtDiv.textContent = `${debt.toFixed(2)} ${type}`;

    const collRatioDiv = document.createElement('div');
    collRatioDiv.style.width = '150px';
    collRatioDiv.className = 'text-gray-600 font-medium';
    collRatioDiv.textContent = `${collRatio}%`;

    const buttonDiv = document.createElement('div');
    const liqButton = document.createElement('button');
    liqButton.className = 'clickable-button bg-black text-white py-2 px-4 rounded font-semibold hover:bg-gray-400';
    liqButton.textContent = 'Liquidate';
    liqButton.onclick = function() {
      liquidate(type, newChild.id);
    }
    if (collRatio > 110) {
      liqButton.disabled = true;
      liqButton.classList.add('bg-gray-400');
      liqButton.classList.remove('clickable-button');
      buttonDiv.classList.add('liqtip');
    }
    
    const tooltipEl = document.createElement('span');
    tooltipEl.className = 'text-xs';
    tooltipEl.classList.add('liqtiptext');
    tooltipEl.textContent = 'Not below liquidation threshold';
    buttonDiv.appendChild(tooltipEl);
    buttonDiv.appendChild(liqButton);


    newChild.appendChild(addressDiv);
    newChild.appendChild(collDiv);
    newChild.appendChild(debtDiv);
    newChild.appendChild(collRatioDiv);
    newChild.appendChild(buttonDiv);

    vaultHook.appendChild(newChild);
}

function resetVaults() {
    const vaultHook = document.getElementById('vaultHook');
    while (vaultHook.firstChild) {
      vaultHook.removeChild(vaultHook.firstChild);
    }
}

//// Interface functionality ////
function toggleDisplay(showId) {
    const ids = ['protocolBox', 'myVaultBox', 'vaultsBox'];
    ids.forEach(id => document.getElementById(id).style.display = (id === showId) ? 'block' : 'none');
}

document.getElementById('protocolBtn').addEventListener('click', () => toggleDisplay('protocolBox'));
document.getElementById('vaultBtn').addEventListener('click', () => toggleDisplay('myVaultBox'));
document.getElementById('vaultsBtn').addEventListener('click', () => toggleDisplay('vaultsBox'));


