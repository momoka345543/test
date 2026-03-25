(() => {
    const createComponent = (content, className, tag = 'div') => {
        const conponent = document.createElement(tag);
        if (className)
            conponent.className = className;
        if (content === undefined || content === null)
            return conponent
        const typeStr = Object.prototype.toString.apply(content)
        if (typeStr === '[object String]')
            conponent.textContent = content
        else if (typeStr === '[object Array]')
            content.map(item=>conponent.appendChild(item))
        else
            conponent.appendChild(content)
        return conponent;
    };

    const _ = (str, arrs = []) => {
        let w = window.QueryParams.i18n[str] === undefined ? str : window.QueryParams.i18n[str]; 
        arrs.map((item, index) => w = w.replace('${'+index+'}', item)); 
        return w
    };

    const loadModal = (title, message, closeCallback) => {
        const btn = createComponent(_('关闭'), 'btn', 'button')
        const modal = createComponent(createComponent([createComponent(title, 'title', 'h2'), createComponent(message, 'message', 'p'), btn], 'modal'), 'mask');
        btn.addEventListener('touchend', () => {document.body.removeChild(modal); closeCallback()})
        document.body.appendChild(modal)
    }

    (async function (w, d, games) {
        const defaultQueryParams = {mode: 'a', btnStyle: '1', loadingStyle: '1', textStyle: '1', game: '1', i18n: {}}
        const initQueryParams = () => new Promise((s,f)=>w.Qs === undefined ? d.head.appendChild(Object.assign(d.createElement('script'), {src: 'qs.js', onerror: f, onload: () => initQueryParams().then(s).catch(f)})) : s(w.QueryParams = Object.assign(w.QueryParams || defaultQueryParams, w.Qs.parse(window.location.search.substring(1)))))
        const initBody = () => [['less.js'].map(s=>d.head.appendChild(Object.assign(d.createElement('script'), {src:s}))),['reset.css', 'game.less'].map(s=>d.head.appendChild(Object.assign(d.createElement('link'), {rel:{css:'stylesheet',less:'stylesheet/less'}[s.split('.')[s.split('.').length-1]], href:s, type:'text/css'}))),w.__SUN_FLOWER__ && w.__SUN_FLOWER__.setScreenMode && ['s','h','a'].indexOf(w.QueryParams.mode) >= 0 && w.__SUN_FLOWER__.setScreenMode({s:1,h:0,a:-1}[w.QueryParams.mode], true)]
        const sizeBody = () => d.body.className = `text-style-${w.QueryParams.textStyle} btn-style-${w.QueryParams.btnStyle} loading-style-${w.QueryParams.loadingStyle} mode-` + (w.innerWidth > w.innerHeight ? 'h' : 's')
        
        await initQueryParams().then(()=>[initBody(), sizeBody(), w.addEventListener('resize', sizeBody)])

        let lastScene = null

        const setScene = (ele, scene) => {
            lastScene && ele.removeChild(lastScene)
            ele.appendChild(scene)
            lastScene = scene
        }

        const loadImgList = (number = 1, list = []) => {
            return new Promise((s, f) => {
                const img = document.createElement('img');
                img.onload = () => loadImgList(number + 1, [...list, number]).then(s).catch(f)
                img.onerror = () => s(list)
                img.src = 'target/' + number + '.jpg';
            })
        }

        const showLoadingScene = (ele) => {
            const loaded = createComponent('0%', 'loaded')
            const scene = createComponent([loaded, createComponent(null, 'loading-bar')], 'scene loading')

            setScene(ele, scene)

            let p = 0;
            let list = null;

            let timer = setInterval(() => {
                p += parseInt(Math.random() * 50)
                loaded.textContent = Math.min(p, list ? 100 : 99) + '%';
                if (list && p >= 100) {
                    clearInterval(timer)
                    setTimeout(() => showLevelScene(ele, list, 0), 300);
                }
            }, 500);

            loadImgList().then(pics=>list=pics);
        }

        const showLevelScene = (ele, imgList, imgIndex) => {

            const prevBtn = createComponent(null, 'prev')
            const nextBtn = createComponent(null, 'next')
            const picPreview = createComponent(null, 'img-preview', 'img')
            picPreview.src = "target/" + imgList[imgIndex] + '.jpg'

            prevBtn.addEventListener('touchend', ()=>{imgIndex = (imgIndex + imgList.length - 1) % imgList.length; picPreview.src = "target/" + imgList[imgIndex] + '.jpg'});
            nextBtn.addEventListener('touchend', ()=>{imgIndex = (imgIndex + 1) % imgList.length; picPreview.src = "target/" + imgList[imgIndex] + '.jpg'});

            const level1Btn = createComponent(_('容易') + ': 3x3', 'btn level', 'button')
            const level2Btn = createComponent(_('正常') + ': 4x4', 'btn level', 'button')
            const level3Btn = createComponent(_('困难') + ': 5x5', 'btn level', 'button')

            level1Btn.addEventListener('touchend', ()=>showGameScene(ele, imgList, imgIndex, 3))
            level2Btn.addEventListener('touchend', ()=>showGameScene(ele, imgList, imgIndex, 4))
            level3Btn.addEventListener('touchend', ()=>showGameScene(ele, imgList, imgIndex, 5))

            const scene = createComponent([
                createComponent(_('选择难度'), 'title'),
                createComponent([prevBtn, picPreview, nextBtn], 'pic-selector'),
                createComponent([level1Btn, level2Btn, level3Btn], 'level-selector'),
            ], 'scene level-select')

            setScene(ele, scene)
        }

        const showGameScene = (ele, imgList, imgIndex, level) => {
            setScene(
                ele, games[w.QueryParams.game](
                    level, "target/" + imgList[imgIndex] + '.jpg', 
                    ()=>showGameScene(ele, imgList, imgIndex, level), ()=>showLevelScene(ele, imgList, imgIndex)
                )
            )
        }
        
        
        if (window.Android && window.Android.postMessage) {
            window.Android.postMessage("viewContent", JSON.stringify({url: window.location.href}))
        }

        showLoadingScene(d.body);
    })(window, document, {
        '1': (() => {

            const getMoveablePositions = (position, level) => {
                let result = [];
                if (position >= level)
                    result.push(position - level)
                if (position + level < level * level)
                    result.push(position + level)
                if (position % level !== 0) {
                    result.push(position - 1)
                }
                if (position % level !== level - 1) {
                    result.push(position + 1)
                }
                return result;
            }

            const makeGrid = (level, pic) => {

                const gridBox = createComponent(null, 'grid grid-' + level)

                const total = level * level;

                const list = [];

                for (let i = 0; i < total; i++) {
                    const item = createComponent(null, 'block block-' + total + ' block-' + i + '-' + total)

                    item.style.backgroundImage = 'url("'+pic+'")';
                    item.setAttribute('data-index', (i + 1) % total);

                    let line = parseInt(i / level)
                    let col = parseInt(i % level)
                    item.style.backgroundPositionX = 'max(' + (0 - col * 90 / level) + 'vw, ' + (0 - col * 90 / level) + 'vh)'
                    item.style.backgroundPositionY = 'max(' + (0 - line * 90 / level) + 'vw, ' + (0 - line * 90 / level) + 'vh)'

                    let index = parseInt(Math.random() * list.length  + 0.5)
                    list.splice(index, 0, item)
                    gridBox.appendChild(item)
                }

                let checkVal = 0;

                list.map((item, index) => {
                    let d = item.getAttribute('data-index') * 1;
                    let tempC = list.reduce((prev, curr, ind) => prev += (curr.getAttribute('data-index') * 1 > d) && ind < index ? 1 : 0, 0);
                    checkVal += tempC
                    if (d === 0) {
                        checkVal += parseInt(index / level)
                        checkVal += parseInt(index % level)
                    }
                })

                if (checkVal % 2 === level % 2)
                    return makeGrid(level, pic)

                let moveAblePosition = [];
                let spaceItem = null;

                list.map((item, index) => {
                    let line = parseInt(index / level)
                    let col = parseInt(index % level)
                    item.style.top = 'min(' + (line * 90 / level) + 'vw, ' + (line * 90 / level) + 'vh)';
                    item.style.left = 'min(' + (col * 90 / level) + 'vw, ' + (col * 90 / level) + 'vh)';
                    item.setAttribute('data-position', index)
                    if (1 * item.getAttribute('data-index') === 0) {
                        moveAblePosition = getMoveablePositions(index, level)
                        spaceItem = item
                    }
                })

                gridBox.addEventListener('touchend', (event) => {
                    if (!event.target.classList.contains('block'))
                        return;
                    if (event.target.classList.contains('block-' + (total - 1) + '-' + total))
                        return;
                    if (moveAblePosition.indexOf(parseInt(event.target.getAttribute('data-position'))) >= 0) {
                        let {top, left} = event.target.style
                        event.target.style.top = spaceItem.style.top
                        event.target.style.left = spaceItem.style.left
                        spaceItem.style.top = top
                        spaceItem.style.left = left

                        let position = event.target.getAttribute('data-position')
                        event.target.setAttribute('data-position', spaceItem.getAttribute('data-position'))
                        spaceItem.setAttribute('data-position', position)

                        moveAblePosition = getMoveablePositions(parseInt(position), level)
                        const e = new Event("step");
                        gridBox.dispatchEvent(e);
                    }
                });

                const checkFinished = () => {
                    return list.reduce((prev, curr) => prev && parseInt(curr.getAttribute('data-index')) === (parseInt(curr.getAttribute('data-position')) + 1) % total, true)
                }

                return [gridBox, checkFinished];
            }

            const showGame = (level, pic, restartCall, backCall) => {
                let steps = 0;
                const stepInfo = createComponent(steps.toString(), 'step')
                const backBtn = createComponent(_('返回'), 'btn', 'button')
                const restartBtn = createComponent(_('重开'), 'btn', 'button')

                backBtn.addEventListener('touchend', backCall);
                restartBtn.addEventListener('touchend', restartCall);

                const [grid, checkFinished] = makeGrid(level, pic);

                const scene = createComponent([
                    grid,
                    createComponent([
                        stepInfo,
                        createComponent([
                            backBtn, 
                            restartBtn
                        ], 'btns')
                    ], 'panel'),
                ], 'scene game game-1')

                grid.addEventListener('step', () => {
                    steps++;
                    stepInfo.textContent = steps.toString();
                    if (checkFinished()) {
                        // 完成
                        loadModal(_('完成'), _('祝贺，您一共使用了${0}步', [steps]), backCall);
                    }
                })
                // loadModal(_('完成'), _('祝贺，您一共使用了${0}步', [steps + 1]), backCall);
                return scene;
            }

            return showGame
        })(),
        '2': (() => {


            const makeGrid = (level, pic) => {

                const gridBox = createComponent(null, 'grid grid-' + level)

                const total = level * level;

                const list = [];

                for (let i = 0; i < total; i++) {
                    const item = createComponent(null, 'block block-' + total + ' block-' + i + '-' + total)

                    item.style.backgroundImage = 'url("'+pic+'")';
                    item.setAttribute('data-index', (i + 1) % total);

                    let line = parseInt(i / level)
                    let col = parseInt(i % level)
                    item.style.backgroundPositionX = 'max(' + (0 - col * 90 / level) + 'vw, ' + (0 - col * 90 / level) + 'vh)'
                    item.style.backgroundPositionY = 'max(' + (0 - line * 90 / level) + 'vw, ' + (0 - line * 90 / level) + 'vh)'

                    let index = parseInt(Math.random() * list.length  + 0.5)
                    list.splice(index, 0, item)
                    gridBox.appendChild(item)
                }

                let firstItem = null;

                list.map((item, index) => {
                    let line = parseInt(index / level)
                    let col = parseInt(index % level)
                    item.style.top = 'min(' + (line * 90 / level) + 'vw, ' + (line * 90 / level) + 'vh)';
                    item.style.left = 'min(' + (col * 90 / level) + 'vw, ' + (col * 90 / level) + 'vh)';
                    item.setAttribute('data-position', index)
                })

                gridBox.addEventListener('touchend', (event) => {
                    if (!event.target.classList.contains('block'))
                        return;
                    if (firstItem === null) {
                        firstItem = event.target
                        firstItem.classList.add('block-select')
                        return;
                    }
                    if (firstItem !== event.target) {
                        let {top, left} = event.target.style
                        event.target.style.top = firstItem.style.top
                        event.target.style.left = firstItem.style.left
                        firstItem.style.top = top
                        firstItem.style.left = left
    
                        let position = event.target.getAttribute('data-position')
                        event.target.setAttribute('data-position', firstItem.getAttribute('data-position'))
                        firstItem.setAttribute('data-position', position)

                        const e = new Event("step")
                        gridBox.dispatchEvent(e)
                    }
                    firstItem.classList.remove('block-select')
                    firstItem = null;
                });

                const checkFinished = () => {
                    return list.reduce((prev, curr) => prev && parseInt(curr.getAttribute('data-index')) === (parseInt(curr.getAttribute('data-position')) + 1) % total, true)
                }

                return [gridBox, checkFinished];
            }

            const showGame = (level, pic, restartCall, backCall) => {
                let steps = 0;
                const stepInfo = createComponent(steps.toString(), 'step')
                const backBtn = createComponent(_('返回'), 'btn', 'button')
                const restartBtn = createComponent(_('重开'), 'btn', 'button')

                backBtn.addEventListener('touchend', backCall);
                restartBtn.addEventListener('touchend', restartCall);

                const [grid, checkFinished] = makeGrid(level, pic);

                const scene = createComponent([
                    grid,
                    createComponent([
                        stepInfo,
                        createComponent([
                            backBtn, 
                            restartBtn
                        ], 'btns')
                    ], 'panel'),
                ], 'scene game game-2')

                grid.addEventListener('step', () => {
                    steps++;
                    stepInfo.textContent = steps.toString();
                    if (checkFinished()) {
                        // 完成
                        loadModal(_('完成'), _('祝贺，您一共使用了${0}步', [steps]), backCall);
                    }
                })
                return scene;
            }

            return showGame
        })()
    })
})();