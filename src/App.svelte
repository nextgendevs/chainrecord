<script>
import { onMount } from 'svelte';
import Page from './Page.svelte' ;
//const fm = new Fortmatic('pk_test_7F64757BB0C010B6', 'kovan');
//window.web3 = new Web3(fm.getProvider());
let bLoading = true, account, abisData;

onMount(
		async () => {
		  window.web3 = loadBlockchainData();
		//  bLoading = false;
		  loadSmartContract();
		}

  );

	 async function loadBlockchainData(){
			const fm = new Fortmatic('pk_test_7F64757BB0C010B6', 'kovan');
			return new Web3(fm.getProvider());
	

await fetch('/abis/abis.json').then((response) => {
    return response.json();
  }).then((myJson) => {
	abisData = myJson;
  });

  const networkId = await web3.eth.net.getId();
  const netData = pVaultData.networks[networkId];


  if(netData)
     { 
      const abi = pVaultData.abi;
      const address = netData.address
     VaultContract = await new web3.eth.Contract(abi, address); 
     //VaultContract.then(()=>{}, ()=>{console.debug("yo")});
    //console.debug(VaultContract);
	/*
	await VaultContract.methods.getVaultInfo().call({
      from : $account
   }).then(async (data)=> {
      bLoading = false;
			 if(!+data.vc){
          oVaultInfo.sMessage = "No Vault created yet";
          console.log("No Vault created yet")
         return;
        }
        oVaultInfo.vno = data.vc;
        oVaultInfo.len = +data.len;
        window.len = data.len;
        window.vno = data.vc;
   },async (err)=> {
		console.log(err);
		sMessage = "No Vault created yet";
   });
   */

   

   
    }


  }

 async function loadSmartContract(){
	const web3 = window.web3 ;
	const accounts = await web3.eth.getAccounts();
	account = accounts[0];




  }

</script>

<main>
	{#if bLoading}
	<div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">
		<span class="sr-only">Loading...</span>
	  </div>
	<h6>Initalizing Web App....</h6>
	{:else}
	  <Page />
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>