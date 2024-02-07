const thumb_list = document.getElementById('thumb-list');
const onClose = document.querySelector('.close-btn');

let page: number = 0;

// #region functions

const buildList = (indexList: string[]) => {

    for (const [index, page] of Object.entries(indexList)) {
        const newLi = document.createElement('li');
        const nodeInput = document.createElement('input');

        nodeInput.type = 'button';
        nodeInput.value = page;
        nodeInput.id = 'node';
        nodeInput.className = 'node-btn';
        newLi.append(nodeInput);

        nodeInput.addEventListener('click', (e) => {
            console.log('click! : ' + index);
            window.sub.pageJump(Number(index));
            nowPage(Number(index));
        });

        thumb_list.appendChild(newLi);
    }
}

const nowPage = (page: number) => {
    const items = thumb_list.querySelectorAll('li');

    for (const [index, item2] of Object.entries(items)) {
        const btn2 = item2.getElementsByTagName('input')[0];
        console.log('all btn off!');
        btn2.classList.remove('node-btn-on');
    }

    const item = items[page];
    const btn = item.getElementsByTagName('input')[0];
    btn.classList.toggle('node-btn-on');
}

// #endregion

// #region events

window.sub.on('page-jump', async (result: any) => page = result.NowPage)

window.addEventListener('load', async (e) => {
    e.preventDefault();

    window.sub.getIndexList()
        .then((result) => {
            buildList(result);
            nowPage(page);
        });
});

onClose.addEventListener('click', async () => {
    window.sub.send('close-sub-window', {});
});

// #endregion

