document.addEventListener('DOMContentLoaded',()=>{
		const container=document.getElementById('games-container');
		fetch('games/games.json')
		.then(r=>r.json())
		.then(games=>{
				games.forEach(game=>{
						const card=document.createElement('div');
						card.style.border='1px solid white';
						card.style.padding='0.5rem';
						card.style.cursor='pointer';
						card.innerHTML=`<img src="${game.folder.replace('/code','')}/cover.png" style="width:100%"><p style="text-align:center;">${game.name}</p>`;
						card.addEventListener('click',()=>window.open(game.folder+'/index.html','_blank'));
						container.appendChild(card);
				});
		}).catch(err=>{console.error("Failed to load games.json",err)});
});
