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
let kusdKoinCV = 0;
let kusdEthCV = 0;
let kusdBtcCV = 0;

let kusdKoinBalance = 0;
let kusdEthBalance = 0;
let kusdBtcBalance = 0;
let kusdKoinCR = 0;
let kusdEthCR = 0;
let kusdBtcCR = 0;

let tvl = 0;
let kusdKoinTVL = 0;
let kusdEthTVL = 0;
let kusdBtcTVL = 0;
let kusdKoinSupply = 0;
let kusdEthSupply = 0;
let kusdBtcSupply = 0;
let kusdKoinGCR = 0;
let kusdEthGCR = 0;
let kusdBtcGCR = 0;

let kusdKoinContract;
let kusdEthContract;
let kusdBtcContract;

let kapPrice = 0;
let koindxPrice = 0;
let koinPrice = 0;
let ethPrice = 0;
let btcPrice = 0;

let vaultCount = 0;
let Vaults = [];
let kusdKoinVaults = [];
let kusdEthVaults = [];
let kusdBtcVaults = [];

// kusd.koinos: 1Gw94xnZ6LjhLg1FV5dF7xPxq7FMVnNn78 - 166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT
// kusd.eth: 1LED2nYrLZUmm4KvruFK3GdQ3DJJSDuky7 - 1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ
// kusd.btc: 1GMYEfx5vzCoctpLuBXpEkfr1MunSmhJTs - 1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey

async function displayTVL() {

  kusdKoinContract = new Contract({
    id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
    abi: utils.tokenAbi,
    provider: kondor.provider,
  }).functions;

  kusdEthContract = new Contract({
    id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
    abi: utils.tokenAbi,
    provider: kondor.provider,
  }).functions;

  kusdBtcContract = new Contract({
    id: "1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey",
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

      kusdKoinContract = new Contract({
        id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
        abi: utils.tokenAbi,
        provider: kondor.provider,
      }).functions;

      kusdEthContract = new Contract({
        id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
        abi: utils.tokenAbi,
        provider: kondor.provider,
      }).functions;

      kusdBtcContract = new Contract({
        id: "1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey",
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
      const options = ['KOIN', 'ETH', 'BTC'];
      options.forEach(option => {
          typeSelect.innerHTML += `<option value="${option}">${option}</option>`;
      });
    } else if (buttonId === 'mintBtn' || buttonId === 'repayBtn') {
      const options = ['Kusd.koin', 'Kusd.eth', 'Kusd.btc'];
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

    if (canBroadcast == true && !isNaN(amount) && amount !=='' && token !=='') {
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
      submitTextEl.textContent = `Deposit fee (0.5%): ${parseFloat((amountValue * 0.005).toFixed(6))} ${tokenValue}`;
      canBroadcast = true;
    } else {
      canBroadcast = false;
    }
  }

  if (activeButton == document.getElementById('withdrawBtn')){
    if (
      tokenValue == 'KOIN' && amountValue > koinBalance || 
      tokenValue == 'ETH' && amountValue > ethBalance ||
      tokenValue == 'BTC' && amountValue > btcBalance) {
        submitTextEl.textContent = 'Exceeds withdrawal limit';
        canBroadcast = false;
    } else {
      canBroadcast = true;
    }
  }

  if (activeButton == document.getElementById('mintBtn')) {
    if ((tokenValue == 'Kusd.koin' && (kusdKoinBalance + parseFloat(amountValue)) * 1.10 > kusdKoinCV) 
      || (tokenValue == 'Kusd.eth' && (kusdEthBalance + parseFloat(amountValue)) * 1.10 > kusdEthCV)
      || (tokenValue == 'Kusd.btc' && (kusdBtcBalance + parseFloat(amountValue)) * 1.10 > kusdBtcCV)) {
      submitTextEl.textContent = 'Exceeds 110% collateral ratio limit';
      canBroadcast = false;
    } else if (!isNaN(amountValue) && amountValue !== "" && amountValue < 1) {
      submitTextEl.textContent = `Minimum amount to mint is 1 ${tokenValue}`;
      canBroadcast = false;
    } else {
      canBroadcast = true;
    }
  }

  if (activeButton == document.getElementById('repayBtn')) {
    if (tokenValue == 'Kusd.koin' && amountValue > kusdKoinBalance 
      || tokenValue == 'Kusd.eth' && amountValue > kusdEthBalance
      || tokenValue == 'Kusd.btc' && amountValue > kusdBtcBalance) {
      submitTextEl.textContent = 'Exceeds repay limit';
      canBroadcast = false;
    } else if (!isNaN(amountValue) && amountValue !== "" && amountValue < 1) {
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
    kusdKoinBalance = 0;
    kusdEthBalance = 0;
    kusdBtcBalance = 0;

    kusdKoinCV = 0;
    kusdEthCV = 0;
    kusdBtcCV = 0;
    kusdKoinCR = 0;
    kusdEthCR = 0;
    kusdBtcCR = 0;

    updateBalances();
}

function updateBalances() {

    document.getElementById('koinBalance').textContent = parseFloat(koinBalance.toFixed(4));
    document.getElementById('kusdKoinBalance').textContent = parseFloat(kusdKoinBalance.toFixed(2));

    document.getElementById('ethBalance').textContent = parseFloat(ethBalance.toFixed(6));
    document.getElementById('kusdEthBalance').textContent = parseFloat(kusdEthBalance.toFixed(2));

    document.getElementById('btcBalance').textContent = parseFloat(btcBalance.toFixed(8));
    document.getElementById('kusdBtcBalance').textContent = parseFloat(kusdBtcBalance.toFixed(2));

    (kusdKoinBalance == 0) ? kusdKoinCR = " - " : kusdKoinCR = (kusdKoinCV / kusdKoinBalance * 100).toFixed(2);
    (kusdEthBalance == 0) ? kusdEthCR = " - " : kusdEthCR = (kusdEthCV / kusdEthBalance * 100).toFixed(2);
    (kusdBtcBalance == 0) ? kusdBtcCR = " - " : kusdBtcCR = (kusdBtcCV / kusdBtcBalance * 100).toFixed(2);

    document.getElementById("kusdKoinCV").textContent = `$ ${kusdKoinCV.toFixed(2)}`;
    document.getElementById("kusdEthCV").textContent = `$ ${kusdEthCV.toFixed(2)}`;
    document.getElementById("kusdBtcCV").textContent = `$ ${kusdBtcCV.toFixed(2)}`;

    document.getElementById("kusdKoinCR").textContent = `${kusdKoinCR}%`;
    document.getElementById("kusdEthCR").textContent = `${kusdEthCR}%`;
    document.getElementById("kusdBtcCR").textContent = `${kusdBtcCR}%`;
}

function formatBalance(num, decimals) {
    return num.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function resetProtocolStats() {

    tvl = 0;
    kusdKoinTVL = 0;
    kusdEthTVL = 0;
    kusdBtcTVL = 0;
    kusdKoinSupply = 0;
    kusdEthSupply = 0;
    kusdBtcSupply = 0;
    kusdKoinGCR = 0;
    kusdEthGCR = 0;
    kusdBtcGCR = 0;

    vaultCount = 0;
    kusdKoinVaults = [];
    kusdEthVaults = [];
    kusdBtcVaults = [];

}

async function updateProtocolStats() {
    document.getElementById("kusdKoinSupply").textContent = formatNum(kusdKoinSupply);
    document.getElementById("kusdEthSupply").textContent = formatNum(kusdEthSupply);
    document.getElementById("kusdBtcSupply").textContent = formatNum(kusdBtcSupply);
    document.getElementById("vaultCount").textContent = vaultCount;

    (kusdKoinSupply == 0) ? kusdKoinGCR = " - " : kusdKoinGCR = (kusdKoinTVL / kusdKoinSupply * 100).toFixed(2);
    (kusdEthSupply == 0) ? kusdEthGCR = " - " : kusdEthGCR = (kusdEthTVL / kusdEthSupply * 100).toFixed(2);
    (kusdBtcSupply == 0) ? kusdBtcGCR = " - " : kusdBtcGCR = (kusdBtcTVL / kusdBtcSupply * 100).toFixed(2);

    document.getElementById('kusdKoinCollateralRatio').textContent = `${kusdKoinGCR}%`;
    document.getElementById('kusdEthCollateralRatio').textContent = `${kusdEthGCR}%`;
    document.getElementById('kusdBtcCollateralRatio').textContent = `${kusdBtcGCR}%`;
    
    document.getElementById('totalTVL').textContent = `$${formatNum(tvl)}`;
}

function formatNum(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// get asset prices from oracles and KoinDX
async function getPrices() {
    // get KAP oracle price
    try {      
      const kapContract = new Contract({
          id: "13PXvxWLMyi4dAd6uS1SehNNFryvFyygnD",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await kapContract.getKapPrice({
        token_address: '1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH'
      });
      kapPrice = result.price / 100000000;

    } catch (error) {
      console.log(error);
    }
    // get KoinDX KOIN price
    try {
      const koindxContract = new Contract({
          id: "15EDfz9ZdepDSV1ERoe8LXN9dvT7X7qMk1",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await koindxContract.getRatio({
        token_address: '1PWNYq8aF6rcKd4of59FEeSEKmYifCyoJc'
      });
      koindxPrice = result.token_b / result.token_a;
    
    } catch (error) {
      console.log(error);
    }
    (koindxPrice > kapPrice) ? koinPrice = koindxPrice : koinPrice = kapPrice;
    console.log('KOIN price: ', koinPrice);
    // get Eth price oracle
    try {
      const ethOracle = new Contract({
          id: "1yM6RU23yJTAFWSYpTjn7dUbcWgY5P1HY",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await ethOracle.getPrice({
        token_address: '15twURbNdh6S7GVXhqVs6MoZAhCfDSdoyd'
      });
      ethPrice = result.price / 100000000;
      console.log('ETH price: ', ethPrice);
    
    } catch (error) {
      console.log(error);
    }
    // get Btc price oracle
    try {
      const btcOracle = new Contract({
          id: "1yM6RU23yJTAFWSYpTjn7dUbcWgY5P1HY",
          abi: utils.tokenAbi,
          provider: kondor.provider,
      }).functions;

      const { operation, result } = await btcOracle.getPrice({
        token_address: '15zQzktjXHPRstPYB9dqs6jUuCUCVvMGB9'
      });
      btcPrice = result.price / 100000000;
      console.log('BTC price: ', btcPrice);
    
    } catch (error) {
      console.log(error);
    }
}


// initialize protocol statistics
async function getProtocolStats() {

    let totalKoin = 0;
    let totalEth = 0;
    let totalBtc = 0;

    (koindxPrice > kapPrice) ? koinPrice = koindxPrice : koinPrice = kapPrice;

    kusdKoinVaults.forEach(vault => {
        vaultCount++;
        totalKoin += +vault[1].koin || 0;
        kusdKoinSupply += +vault[1].kusd_koin || 0;
    });

    kusdEthVaults.forEach(vault => {
        vaultCount++;
        totalEth += +vault[1].eth || 0;
        kusdEthSupply += +vault[1].kusd_eth || 0;
    });

    kusdBtcVaults.forEach(vault => {
        vaultCount++;
        totalBtc += +vault[1].btc || 0;
        kusdBtcSupply += +vault[1].kusd_btc || 0;
    });

    totalKoin ? kusdKoinTVL = (totalKoin / 100000000 * koinPrice) : kusdKoinTVL = 0;
    tvl += kusdKoinTVL;
    totalEth ? kusdEthTVL = (totalEth / 100000000 * ethPrice) : kusdEthTVL = 0;
    tvl += kusdEthTVL;
    totalBtc ? kusdBtcTVL += (totalBtc / 100000000 * btcPrice) : kusdBtcTVL = 0;
    tvl += kusdBtcTVL;

    isNaN(kusdKoinSupply) ? kusdKoinSupply = 0 : kusdKoinSupply /= 100000000;
    isNaN(kusdEthSupply) ? kusdEthSupply = 0 : kusdEthSupply /= 100000000;
    isNaN(kusdBtcSupply) ? kusdBtcSupply = 0 : kusdBtcSupply /= 100000000;
}


//// Smart contract functionality ////

// get data from all vaults
async function getVaultsInfo() {

    try {
      let { operation, result } = await kusdKoinContract.getKoinVaults({
        limit: 1000
      });
      if (result) {
        result.accounts.forEach((account) => {
          kusdKoinVaults.push([account]);
        });
      }

      ({ result } = await kusdKoinContract.getKoinProtocolBalances({
        limit: 1000
      }));
      if (result) {
        result.kvb.forEach((account, i) => {
          kusdKoinVaults[i].push(account);
        });
      }
      console.log(kusdKoinVaults);

    } catch (error) {
      console.log(error);
    }

    try {
      let { operation, result } = await kusdEthContract.getEthVaults({
        limit: 1000
      });
      if (result) {
        result.accounts.forEach((account) => {
          kusdEthVaults.push([account]);
        });
      }

      ({ result } = await kusdEthContract.getEthProtocolBalances({
        limit: 1000
      }));
      if (result) {
        result.kvb.forEach((account, i) => {
          kusdEthVaults[i].push(account);
        });
      }
      console.log(kusdEthVaults);

    } catch (error) {
      console.log(error);
    }

    try {
      let { operation, result } = await kusdBtcContract.getBtcVaults({
        limit: 1000
      });
      if (result) {
        result.accounts.forEach((account) => {
          kusdBtcVaults.push([account]);
        });
      }

      ({ result } = await kusdBtcContract.getBtcProtocolBalances({
        limit: 1000
      }));
      if (result) {
        result.kvb.forEach((account, i) => {
          kusdBtcVaults[i].push(account);
        });
      }
      console.log(kusdBtcVaults);

    } catch (error) {
      console.log(error);
    } 

}

// Get the balances of the user's vault
async function getVaultBalances() {
    // get Koin, kusd.koin balances
    try {
      const { operation, result } = await kusdKoinContract.getKoinVault({
        owner: connectedAccount,
      })
      console.log(result);
      if (result == undefined) {
        koinBalance = 0, kusdKoinBalance = 0, kusdKoinCV = 0;
      } else {
        result.koin == undefined ? koinBalance = 0 : koinBalance = result.koin / 100000000;
        result.kusd_koin == undefined ? kusdKoinBalance = 0 : kusdKoinBalance = result.kusd_koin / 100000000;
        kusdKoinCV = koinBalance * koinPrice;
      }
    } catch (error) {
      console.error(error);
    }
    // get Eth, kusd.eth balances
    try {
      const { operation, result } = await kusdEthContract.getEthVault({
        owner: connectedAccount,
      })
      console.log(result);
      if (result == undefined) {
        ethBalance = 0, kusdEthBalance = 0, kusdEthCV = 0;
      } else {
        result.eth == undefined ? ethBalance = 0 : ethBalance = result.eth / 100000000;
        result.kusd_eth == undefined ? kusdEthBalance = 0 : kusdEthBalance = result.kusd_eth / 100000000;
        kusdEthCV = ethBalance * ethPrice;
      }
    } catch (error) {
      console.error(error);
    }
    // get Btc, kusd.btc balances
    try {
      const { operation, result } = await kusdBtcContract.getBtcVault({
        owner: connectedAccount,
      })
      if (result == undefined) {
        btcBalance = 0, kusdBtcBalance = 0, kusdBtcCV = 0;
      } else {
        result.btc == undefined ? btcBalance = 0 : btcBalance = result.btc / 100000000;
        result.kusd_btc == undefined ? kusdBtcBalance = 0 : kusdBtcBalance = result.kusd_btc / 100000000;
        kusdBtcCV = btcBalance * btcPrice;
      }
    } catch (error) {
      console.error(error);
    }
    updateBalances();
}

// Send a transaction
async function manageVault(action, token, amount) {
    console.log(action, token, amount);

    try {
      if (token == "KOIN" || token == "Kusd.koin") {
        const contract = new Contract({ 
          id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
          abi: utils.tokenAbi, 
          provider: kondor.provider, 
          signer: kondor.getSigner(connectedAccount)
        }).functions;
  
        if (action == "deposit") {
          const { transaction, receipt } = await contract.depositKoin({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8),
            fee: 5,
            fee_address: "1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH"
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "mint") {
          const { transaction, receipt } = await contract.mintKusdKoin({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "withdraw") {
          const { transaction, receipt } = await contract.withdrawKoin({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "repay") {
          const { transaction, receipt } = await contract.repayKusdKoin({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        }
  
      } else if (token == "ETH" || token == "Kusd.eth") {
        const contract = new Contract({ 
          id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
          abi: utils.tokenAbi, 
          provider: kondor.provider, 
          signer: kondor.getSigner(connectedAccount)
        }).functions;
        
        if (action == "deposit") {
          const { transaction, receipt } = await contract.depositEth({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8),
            fee: 5,
            fee_address: "1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH"
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "mint") {
          const { transaction, receipt } = await contract.mintKusdEth({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "withdraw") {
          const { transaction, receipt } = await contract.withdrawEth({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "repay") {
          const { transaction, receipt } = await contract.repayKusdEth({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        }
  
      } else if (token == "BTC" || token == "Kusd.btc") {
        const contract = new Contract({ 
          id: "1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey",
          abi: utils.tokenAbi, 
          provider: kondor.provider, 
          signer: kondor.getSigner(connectedAccount)
        }).functions;
        
        if (action == "deposit") {
          const { transaction, receipt } = await contract.depositBtc({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8),
            fee: 5,
            fee_address: "1Mzp89UMsSh6Fiy4ZEVvTKsmxUYpoJ3emH"
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "mint") {
          const { transaction, receipt } = await contract.mintKusdBtc({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "withdraw") {
          const { transaction, receipt } = await contract.withdrawBtc({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        } else if (action == "repay") {
          const { transaction, receipt } = await contract.repayKusdBtc({
            account: connectedAccount,
            amount: utils.parseUnits(amount, 8)
          });      
          console.log(transaction, receipt);
          await log(transaction, receipt);
  
        }
      }
        
        getVaultBalances();

        document.getElementById('token').innerHTML = '<option value="" disabled selected>Select Type</option>';
        document.getElementById('amount').value = '';
        submitTextEl. textContent = '';

        await resetProtocolStats();
        await getVaultsInfo();
        await getProtocolStats();
        updateProtocolStats();
        displayVaults();

    } catch (error) {
         console.error(error);
    }
}
    
    // kusd.koin: 1Gw94xnZ6LjhLg1FV5dF7xPxq7FMVnNn78 - 166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT
    // kusd.eth: 1LED2nYrLZUmm4KvruFK3GdQ3DJJSDuky7 - 1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ
    // kusd.btc: 1GMYEfx5vzCoctpLuBXpEkfr1MunSmhJTs - 1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey

async function liquidate(type, vaultAddress) {

    try {
        if (type == 'KOIN') {
          const contract = new Contract({ 
            id: "166BxNmWGuZHYAVHCeh6D8i7XF5qX21kGT",
            abi: utils.tokenAbi, 
            provider: kondor.provider, 
            signer: kondor.getSigner(connectedAccount)
          }).functions;

          const { transaction, receipt } = await contract.liquidateKusdKoin({
            account: connectedAccount,
            vault: vaultAddress
          });
          await log(transaction, receipt);
        } else if (type == 'ETH') {
          const contract = new Contract({ 
            id: "1LBctrVzWGddqzDXJJC8WJm4ax69U5w8AJ",
            abi: utils.tokenAbi, 
            provider: kondor.provider, 
            signer: kondor.getSigner(connectedAccount)
          }).functions;

          const { transaction, receipt } = await contract.liquidateKusdEth({
            account: connectedAccount,
            vault: vaultAddress
          });
          await log(transaction, receipt);
        } else if (type == 'BTC') {
          const contract = new Contract({ 
            id: "1DsZs1UVEHBEWv4MSwLksM8yEbjDWUS1Ey",
            abi: utils.tokenAbi, 
            provider: kondor.provider, 
            signer: kondor.getSigner(connectedAccount)
          }).functions;

          const { transaction, receipt } = await contract.liquidateKusdBtc({
            account: connectedAccount,
            vault: vaultAddress
          });
          await log(transaction, receipt);
        }

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
    let vaultList = [];

    kusdKoinVaults.forEach((vault) => {
      console.log(vault);
      let {koin, kusd_koin, eth, kusd_eth, btc, kusd_btc} = vault[1];
      let debtType = kusd_koin ? 'Kusd.koin' :
               kusd_eth ? 'Kusd.eth' :
               kusd_btc ? 'Kusd.btc' :
               undefined;
      if (debtType) {
        let debtAmount = (kusd_koin || kusd_eth || kusd_btc) / 100000000;
        let collateralType = koin ? 'Koin' : eth ? 'Eth' : 'Btc';
        let collateralAmount = (koin || eth || btc) / 100000000;
        let collateralValue = 
            (!isNaN(+koin) ? koin / 100000000 * koinPrice : 0) + 
            (!isNaN(+eth) ? eth / 100000000 * ethPrice : 0) + 
            (!isNaN(+btc) ? btc / 100000000 * btcPrice : 0);
        let collateralRatio = collateralValue / debtAmount * 100;
        vaultList.push([vault[0], debtAmount, debtType, collateralRatio, collateralType]);
      }
    });

    vaultList.sort((a, b) => a[3] - b[3]);
    vaultList.forEach(element => addVault(...element));

}

function addVault(address, debt, type, collRatio, collType) {
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
    collDiv.textContent = collType;
    
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


