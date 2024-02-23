import * as pdfjs from '../node_modules/pdfjs-dist/build/pdf.min.mjs';

const body = document.body;
const container = document.getElementById('app');
const btnArea = document.getElementById('btn-area');
const graph = document.getElementById('graph') as HTMLCanvasElement;
const ctx = graph.getContext('2d');
const onFitCheck = document.querySelector('.fit-off');
const onSubBtn = document.querySelector('.sub-window-off');

const SCALE_STEP = 0.02;
const MAX_SCALE = 2.5, MIN_SCALE = 0.1;
const LimitSize = [1920, 1680];

let _archive: IRender;
let _img: HTMLImageElement;
let _drawing: any;

let _originalSize:[number, number] = [0, 0];
let _scale: number = 1;
let _coefficient: number = 1;
let _isDrag: number = 0;
let _isFit: boolean = false;

pdfjs.GlobalWorkerOptions.workerSrc = '../build/pdf.worker.min.mjs';

// #region functions

const preventDefault = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
};

const centering = () => {
    if (window.innerWidth > graph.width) {
        body.style.width = '100%';
    }
    else {
        body.style.width = 'auto';
    }
    if (window.innerHeight > graph.height) {
        body.style.height = '100%';
    }
    else {
        body.style.height = 'auto';
    }
}

const styleChange = () => {
    body.style.backgroundColor = '#888888';
    container.hidden = true;
    btnArea.hidden = false;
    graph.hidden = false;
}

const clear = (arg: any) => {
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

const move = (e) => {
    window.scrollBy(-e.movementX, -e.movementY);
}

const zoom = (e) => {
    if (_isDrag >= 1) {
        _isDrag = 2;

        if (_isFit) return;

        if (e.movementX > 0) {
            _scale += SCALE_STEP;
            _scale = Math.min(_scale, MAX_SCALE);
        }
        else if (e.movementX < 0) {
            _scale -= SCALE_STEP;
            _scale = Math.max(_scale, MIN_SCALE);
        }

        draw(_scale);
    }
}

const fit = () => {
    let fit = 1;

    if (_originalSize[0] > _originalSize[1]) {
        fit = window.innerWidth / _originalSize[0];
    }
    else {
        fit = window.innerHeight / _originalSize[1];
    }

    _scale = fit;
}

const defScale = () => {
    draw(1);
}

const draw = (drawScale: number) => {

    const center = [
        document.documentElement.clientWidth / 2,
        document.documentElement.clientHeight / 2
    ];

    const vcenter = [scrollX + center[0], scrollY + center[1]];
    const nowsize = [graph.width, graph.height];

    _drawing(drawScale);

    const new_scroll = [
        Math.floor(graph.width * vcenter[0] / nowsize[0]) - center[0],
        Math.floor(graph.height * vcenter[1] / nowsize[1]) - center[1]
    ];

    window.scrollTo(new_scroll[0], new_scroll[1]);

    centering();
    changeTitle();
}

const sizeLimit = (w: number, h: number) => {

    if (w > LimitSize[0]) {
        _coefficient = LimitSize[0] / w;
        return [LimitSize[0], h * _coefficient];
    }
    else if (h > LimitSize[1]) {
        _coefficient = LimitSize[1] / h;
        return [w * _coefficient, LimitSize[1]];
    }
    else {
        return [w, h];
    }
}

const selector = (params: any) => {
    if (params.Mode == 'pdf') {
        _archive = new pdf_render();
    }
    else if (params.Mode == 'zip') {
        _archive = new zip_render();
    }
    else {
        throw new Error('render error');
    }
    _drawing = (scale: number) => _archive.fetch(params, scale);
    _archive.start(params);
    changeTitle();

    window.api.sender('sync2sub', {});
}

const nextPage = () => {
    window.api.pageShift(1)
        .then((result) => selector(result))
        .finally(() => window.scrollTo(0, 0));
}

const prevPage = () => {
    window.api.pageShift(-1)
        .then((result) => selector(result))
        .finally(() => window.scrollTo(0, 0));
}

const changeTitle = () => {
    window.sub.sender('get-page', {}).then((result) => {
        document.title = '';
        document.title += result.FileName;
        if (result.PageName === '') {
            document.title += ' [' + result.PageNumber + '] ';
        }
        else {
            document.title += ' [' + result.PageName + '] ';
        }
        document.title += Math.floor(_scale * 100) / 100;
    });
}

// #endregion

// #region events

window.api.reciever('image-send', (result: any) => selector(result));

window.api.reciever('sub-window-off', () => {
    onSubBtn.classList.remove('sub-window-on');
});

window.addEventListener('beforeunload', () => {
    window.api.sender('send-scale', { Scale: _scale, });
});

window.addEventListener('resize', (e) => {
    if (!_isFit
        && (window.innerWidth > graph.scrollWidth || window.innerHeight > graph.scrollHeight)) {
        centering();
    }
    else if (_isFit) {
        fit();
    }
});

window.addEventListener('mousedown', (e) => {
    e.preventDefault();

    if (_img != undefined) {
        switch (e.button) {
            case 2:
                _isDrag = 1;
                window.addEventListener('mousemove', zoom);
                break;
            default:
        }
    }
});

window.addEventListener('mouseup', (e) => {
    e.preventDefault();

    if (_img != undefined) {
        switch (e.button) {
            case 0:
                break;
            case 1:
                // ホイールクリック
                (onFitCheck as HTMLInputElement).click();
                break;
            case 2:
                // ドラッグ終了
                if (_isDrag != 2) {
                    nextPage();
                }
                _isDrag = 0;
                window.removeEventListener('mousemove', zoom)
                break;
            case 3:
                // 戻るクリック
                nextPage();
                break;
            case 4:
                // 進むクリック
                prevPage();
                break;
            default:
        }
    }
});

window.addEventListener('dblclick', (e) => {
    e.preventDefault();

    if (_img != undefined) {
        switch (e.button) {
            case 0:
                prevPage();
                break;
            default:
        }
    }
});

container.addEventListener('dragover', (e) => {
    preventDefault(e);
});

container.addEventListener('drop', (e) => {
    preventDefault(e);

    for (const file of e.dataTransfer!.files) {
        window.api.getDrop(file.path).then((result) => selector(result));
    }
});

container.addEventListener('click', async (e) => {
    e.preventDefault();
    switch (e.button) {
        case 0:
            window.api.openFileDialog().then((result) => selector(result));
            break;
        default:
    }
});

graph.addEventListener('mousedown', (e) => {
    e.preventDefault();

    switch (e.button) {
        case 0:
            graph.addEventListener('mousemove', move);
            break;
        default:
    }
});

graph.addEventListener('mouseup', (e) => {
    e.preventDefault();

    switch (e.button) {
        case 0:
            graph.removeEventListener('mousemove', move);
            break;
        default:
    }
});

onFitCheck.addEventListener('click', () => {
    onFitCheck.classList.toggle('fit-on');

    if (_isFit) {
        _isFit = false;
    }
    else {
        _isFit = true;
        fit();
    }
    draw(_scale);

    window.scrollTo(0, 0);
});

onSubBtn.addEventListener('click', () => {
    onSubBtn.classList.toggle('sub-window-on');
    if (onSubBtn.classList.contains('sub-window-on')) {
        window.api.sender('open-sub-window', {});
    }
    else {
        window.api.sender('close-sub-window', {});
    }
});

// #endregion

// #region class

interface IRender {
    fetch(data: any, scale: number): void;
    start(data: any): void;
}

class zip_render implements IRender {

    fetch(data: any, scale: number) {
        // 倍率調整
        scale -= 0.0000000001;

        graph.width = _originalSize[0] * scale;
        graph.height = _originalSize[1] * scale;

        ctx.scale(scale, scale);
        ctx.drawImage(_img, 0, 0);
    }

    start(data: any) {
        _img = new Image();
        _img.onload = (e) => {
            styleChange();
            const size = sizeLimit(_img.width, _img.height);
            _originalSize = [size[0], size[1]];
            graph.width = _originalSize[0];
            graph.height = _originalSize[1];

            if (_isFit) fit();
            draw(_scale);
        };

        let blob = new Blob([data.Buffer], { type: data.Type });
        let urlCreator = window.URL || window.webkitURL;
        let src = urlCreator.createObjectURL(blob);

        _img.src = src;
    }
}

class pdf_render implements IRender {

    private _doc: pdfjs.PdfDocumentProxy;
    private _renderInProgress:boolean = true;

    fetch(data: any, scale: number) {
        if (this._renderInProgress) {
            this._renderInProgress = false;

            this._doc.getPage(data.Page).then((page) => {
                const view = page.getViewport({ scale: _coefficient, });
                graph.width = view.width * scale;
                graph.height = view.height * scale;

                ctx.scale(scale, scale);

                page.render({ canvasContext: ctx, viewport: view, }).promise
                    .finally(() => this._renderInProgress = true);
            });
        }
    }

    start(data: any) {
        pdfjs.getDocument(data.Data).promise
            .then((doc) => {
                this._doc = doc;
                return doc.getPage(data.Page);
            }).then((page) => {
                let view: pdfjs.PageViewport = page.getViewport({ scale: 1, });
                const size = sizeLimit(view.width, view.height);
                _originalSize = [size[0], size[1]];

                view = page.getViewport({ scale: _coefficient, });

                if (_isFit) fit();
                graph.width = size[0] * _scale;
                graph.height = size[1] * _scale;

                ctx.scale(_scale, _scale);

                _img = new Image();

                return page.render({ canvasContext: ctx, viewport: view, }).promise;
            }).then(() => {
                styleChange();
            });
    }
}

// #endregion
