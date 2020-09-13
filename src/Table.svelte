<script>

export let account;
export let VaultContract;

let TableData = [];

if(VaultContract && account)
{
VaultContract.methods.getAssignment(1001).call({
      from : account
   }).then( (data) => {



   });
}

</script>
<table class="table">


    <thead class="thead-dark">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Origin</th>
        <th scope="col">Destnation</th>
        <th scope="col">Status</th>
        <th scope="col">Message</th>
      </tr>
    </thead>
    <tbody>
  
    {#if TableData.length }
    
    {#each TableData as ele, i}
      <tr>
        <th scope="row">{i+1}</th>
         <td>{ele["0"]}</td>
        <td>{ele["1"]}</td>
        <td>{ele["4"]}</td>
        <td>{ele["5"]}</td>
      </tr>
    {/each}
    
     {:else}
   <div class="spinner-border text-dark" role="status">
    <span class="sr-only">Loading...</span>
  </div>
     {/if} 
    </tbody>
  </table>
