// import { PDFPageProxy, getDocument, } from 'pdfjs-dist';
import * as pdf from '../node_modules/pdfjs-dist/build/pdf.min.mjs';

const body = document.body;
const container = document.getElementById('app');
const btnArea = document.getElementById('btn-area');
const graph = document.getElementById('graph') as HTMLCanvasElement;
const ctx = graph.getContext('2d');
const onFitCheck = document.querySelector('.fit-off');
const onSubBtn = document.querySelector('.sub-window-off');

const SCALE_STEP = 0.01;
const MAX_SCALE = 1.5, MIN_SCALE = 0.5;

let _img: HTMLImageElement;

let _scale = 1;
let _scrollPosition:[number, number] = [0, 0];
let _originalSize:[number, number] = [0, 0];
let _isDrag: number = 0;
let _isFit: boolean = false;
let _page;
let _renderInProgress = true;
let drawing;

pdf.GlobalWorkerOptions.workerSrc = '../build/pdf.worker.min.mjs';

// #region functions

const preventDefault = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
};

const checkCenter = () => {
    if (window.innerWidth > graph.width) {
        body.style.width = "100%";
    }
    else {
        body.style.width = "auto";
    }
    if (window.innerHeight > graph.height) {
        body.style.height = "100%";
    }
    else {
        body.style.height = "auto";
    }
}

const styleChange = () => {
    body.style.backgroundColor = "#888888";
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

    if (window.innerWidth == _img.width || window.innerHeight == _img.height) {
        return;
    }
    else {
        if (window.innerWidth > window.innerHeight) {
            fit = window.innerHeight / _img.height;
        }
        else if (window.innerWidth < window.innerHeight) {
            fit = window.innerWidth / _img.width;
        }
    }

    draw(fit);
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

    drawing(drawScale);

    const new_scroll = [
        Math.floor(graph.width * vcenter[0] / nowsize[0]) - center[0],
        Math.floor(graph.height * vcenter[1] / nowsize[1]) - center[1]
    ];

    window.scrollTo(new_scroll[0], new_scroll[1]);
    _scrollPosition = [scrollX, scrollY];

    checkCenter();

    document.title = _scale.toString();
}

const fetchZip = (scale: number) => {
    // 倍率調整
    scale -= 0.0000000001;

    graph.width = _originalSize[0] * scale;
    graph.height = _originalSize[1] * scale;

    ctx.scale(scale, scale);

    ctx.drawImage(_img, 0, 0);
}

const startZip = (arg: any) => {
    _img = new Image();
    _img.onload = (e) => {
        styleChange();

        _originalSize = [_img.width, _img.height];

        graph.width = _img.width;
        graph.height = _img.height;

        draw(_scale);
    };

    let blob = new Blob([arg.Buffer], { type: arg.Type });
    let urlCreator = window.URL || window.webkitURL;
    let src = urlCreator.createObjectURL(blob);

    _img.src = src;
}

const fetchPdf = (scale: number) => {
    if (_renderInProgress) {
        _renderInProgress = false;

        scale -= 0.0000000001;

        const view = _page.getViewport({ scale: scale, });
        graph.width = view.width * scale;
        graph.height = view.height * scale;

        ctx.scale(scale, scale);

        _page.render({ canvasContext: ctx, viewport: view, }).promise
            .finally(() => _renderInProgress = true);
    }
}

const startPdf = (arg: any, scale: number) => {
    pdf.getDocument(arg.Data).promise
        .then((doc) => {
            return doc.getPage(arg.Page);
        }).then((page) => {
            _page = page;
            const view = page.getViewport({ scale: scale, });
            graph.width = view.width;
            graph.height = view.height;
            _img = new Image();
            _originalSize = [view.width, view.height];
            return page.render({ canvasContext: ctx, viewport: view, }).promise;
        }).then(() => {
            styleChange();
        });

}

const selector = (params: any) => {
    if (params.Data != undefined) {
        // Pdfモード
        drawing = (scale: number) => fetchPdf(scale);
        startPdf(params, _scale);
    }
    else if (params.Buffer != undefined) {
        // Zipモード
        drawing = (scale: number) => fetchZip(scale);
        startZip(params);
    }
}

// #endregion

// #region events

window.api.on('image-send', async (result: any) => selector(result));

window.api.on('sub-window-off', () => {
    onSubBtn.classList.remove('sub-window-on');
});

window.addEventListener('beforeunload', () => {
    window.api.send('send-scale', { Scale: _scale, });
});

window.addEventListener('resize', (e) => {
    if (!_isFit
        && (window.innerWidth > graph.scrollWidth || window.innerHeight > graph.scrollHeight)) {
        checkCenter();
    }
    else if (_isFit) {
        fit();
    }
});

window.addEventListener('mousedown', (e) => {
    e.preventDefault();
    switch (e.button) {
        case 2:
            if (_img != undefined) {
                _isDrag = 1;
                window.addEventListener('mousemove', zoom);
                break;
            }
        default:
    }
});

window.addEventListener('mouseup', (e) => {
    e.preventDefault();
    switch (e.button) {
        case 2:
            // ドラッグ終了
            if (_isDrag > 1) {
                _isDrag = 0;
                window.removeEventListener('mousemove', zoom)
            }
            break;
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
            // 左クリック
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
            // 左クリック
            graph.removeEventListener('mousemove', move);
            break;
        case 1:
            // ホイールクリック
            (onFitCheck as HTMLInputElement).click();
            break;
        case 2:
            // ドラッグ終了
            if (_isDrag > 1) {
                _isDrag = 0;
            }
            else {
                // 次のページ
                window.api.pageShift(1).then((result) => selector(result));
            }
            window.removeEventListener('mousemove', zoom)
            break;
        case 3:
            // 戻るクリック
            // 前のページ
            window.api.pageShift(-1).then((result) => selector(result));
            break;
        case 4:
            // 進むクリック
            // 次のページ
            window.api.pageShift(1).then((result) => selector(result));
            break;
        default:
            alert('Error');
    }
});

graph.addEventListener('dblclick', (e) => {
    e.preventDefault();
    switch (e.button) {
        case 0:
            // 前のページ
            window.api.pageShift(-1).then((result) => selector(result));
            break;
        default:
    }
});

onFitCheck.addEventListener('click', () => {
    onFitCheck.classList.toggle('fit-on');

    if (_isFit) {
        _isFit = false;
        draw(_scale);
        window.scrollTo(0, 0);
    }
    else {
        _isFit = true;
        fit();
    }
});

onSubBtn.addEventListener('click', () => {
    onSubBtn.classList.toggle('sub-window-on');
    if (onSubBtn.classList.contains('sub-window-on')) {
        window.api.send('open-sub-window', {});
    }
    else {
        window.api.send('close-sub-window', {});
    }
});

// #endregion
