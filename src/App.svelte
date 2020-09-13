<script>
import { onMount } from 'svelte';
 let VaultContract;
 let account ;

//import Page from './Page.svelte' ;
//const fm = new Fortmatic('pk_test_7F64757BB0C010B6', 'kovan');
//window.web3 = new Web3(fm.getProvider());
let bLoading = true, abisData;

onMount(
		async () => {
		  window.web3 = await loadBlockchainData();
		//  bLoading = false;
		  loadSmartContract();
		}

  );

	 async function loadBlockchainData(){
			const fm = new Fortmatic('pk_test_7F64757BB0C010B6', 'kovan');
			return new Web3(fm.getProvider());
	 }

 	async function loadSmartContract(){
	const web3 = window.web3 ;
	const accounts = await web3.eth.getAccounts();
	account= accounts[0];

	await fetch('/abis/abis.json').then((response) => {
    return response.json();
  }).then((myJson) => {
	abisData = myJson;
  });

  const networkId = await web3.eth.net.getId();
  const netData = abisData.networks[networkId];


  if(netData)
     { 
      const abi = abisData.abi;
      const address = netData.address
   VaultContract = await new web3.eth.Contract(abi, address) ; //
   bLoading = false;
   loadTableData();
	 }
  }
  let TableData = [];
  async function loadTableData(){

	TableData = [];
if(VaultContract && account)
{

	let awbs = [1001,1002, 1003, 1004];

	awbs.forEach(function(ele){
		VaultContract.methods.getAssignment(ele).call({
      from : account
   }).then( (data) => {
	data.awb = ele;
    TableData = [...TableData, data];
   });
	})

}
  }

  async function ReceiveGoods(oEvent){
	
	let awb = +this.name;

	
	VaultContract.methods.receiveGoods(awb).call({
      from : account
   }).then( (data) => {
	loadTableData();
   }, (error) => {
	   console.debug(error);
   });

  }


</script>

<main>
	{#if bLoading}
	<div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">
		<span class="sr-only">Loading...</span>
	  </div>
	<h6>Initalizing Web App....</h6>
	{:else}
	<nav class="navbar navbar-light" style="background-color: #e3f2fd;">
		<a class="navbar-brand" href="#">
		  <img src="/icon.jpg" width="30" height="30" class="d-inline-block align-top" alt="">
		 CHAINrecord
		</a>	  
	  </nav>
	<table class="table">


		<thead class="thead-dark">
		  <tr>
			<th scope="col">#</th>
			<th scope="col">Origin</th>
			<th scope="col">Destnation</th>
			<th scope="col">Status</th>
			<th scope="col">Message</th>
			<th scope="col">Action</th>
		  </tr>
		</thead>
		<tbody>
	  
		{#if TableData.length }
		
		{#each TableData as ele, i}
		  <tr>
			<th scope="row">{ele.awb}</th>
			 <td>{ele[0]}</td>
			<td>{ele[1]}</td>
			<td>{ele[4]}</td>
			<td>{ele[5]}</td>
			<td>
				{#if ele[4] == 'Ready for Retrival' }
				<button type="button" name="{ele.awb}"  on:click= {ReceiveGoods} class="btn btn-primary margin-half " >
				Receive Goods
			  </button>
			  {/if}
			</td>
		  </tr>
		{/each}
		
		 {:else}
	   <div class="spinner-border text-dark" role="status">
		<span class="sr-only">Loading...</span>
	  </div>
		 {/if} 
		</tbody>
	  </table>
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