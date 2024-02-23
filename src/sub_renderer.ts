const thumb_list = document.getElementById('thumb-list');
const onClose = document.querySelector('.close-btn');

// #region functions

const buildList = (indexList: string[]) => {
    indexList.forEach((value, index) => {
        const newLi = document.createElement('li');
        const nodeInput = document.createElement('input');

        nodeInput.type = 'button';
        nodeInput.value = value;
        nodeInput.id = 'node';
        nodeInput.className = 'node-btn';
        newLi.append(nodeInput);

        nodeInput.addEventListener('click', (e) => {
            window.sub.pageJump(Number(index));
        });

        thumb_list.appendChild(newLi);
    });
}

const pageMarking = (name: string, page: number) => {
    const items = thumb_list.querySelectorAll('li');

    items.forEach((item, index) => {
        const btn = item.getElementsByTagName('input')[0];
        if (btn.value == name || btn.value as unknown as number == page) {
            btn.classList.add('node-btn-on');
        }
        else {
            btn.classList.remove('node-btn-on');
        }
    });
}

// #endregion

// #region events

window.sub.reciever('sync2sub', async (result: any) => {
    pageMarking(result.PageName, result.PageNumber);
});

window.addEventListener('load', (e) => {
    e.preventDefault();

    window.sub.getIndexList().then((result) => buildList(result));
    window.sub.sender('get-page', {}).then((result) => {
        pageMarking(result.PageName, result.PageNumber);
    });
});

onClose.addEventListener('click', async () => {
    window.sub.sender('close-sub-window', {});
});

// #endregion

