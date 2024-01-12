
const COLOR_SET: string[] = ["#ffffff", "#dd6600", "#cc0000", "#5555cc", "purple", "black", "yellow", "green"];

type ScoreTile = HTMLElement & {bw__prevChild: ScoreTile, tileIndex: number};

type ScoreDiv = HTMLElement & {bw__lastChild: ScoreTile, ncols: number};

type ScoreEntry = {
    score: number
    index: number
    next: ScoreEntry
} | null

class ScoreTileIterator {
    __c: ScoreTile | null;

    constructor() {
        this.__c = (document.getElementById("score-div") as unknown as {bw__lastChild: ScoreTile}).bw__lastChild as ScoreTile;
    }

    next(): IteratorResult<ScoreTile, void> {
        if (this.__c === null) return { done: true, value: undefined };
        const yieldResult = {
            done: false,
            value: this.__c,
        }
        this.__c = this.__c.bw__prevChild;
        // @ts-ignore; should work. idk
        return yieldResult;
    }

    [Symbol.iterator]() {
        return this;
    }
}

class ScoreField {
    __t: ScoreTile
    __p: HTMLElement

    constructor(t: ScoreTile) {
        this.__t = t;
        this.__p = document.getElementById(this.__t.getAttribute("dataid"))
    }

    get(): number {
        return parseInt(this.__p.innerText);
    }

    set(n: number) {
        this.__p.innerText = n.toString();
    }
}


/**
 * Button callback for increasing score of one tile.
 */
function uptickHandler(e: Event, id: string): void {
    const t = document.getElementById(id);
    t.innerText = (parseInt(t.innerText) + 1).toString();
    storeScores();
}

/**
 * Button callback for decreasing score of one tile.
 */
function downtickHandler(e: Event, id: string): void {
    const t = document.getElementById(id);
    t.innerText = (parseInt(t.innerText) - 1).toString();
    storeScores();
}

/**
 * Fixes the score grid `_sd` to maintain squareness.
 */
function adjustGrid(_sd: HTMLElement) {
    let sd = _sd as HTMLElement & {ncols: number};
    sd.ncols = Math.ceil(Math.sqrt(_sd.childElementCount));
    sd.style.gridTemplateColumns = `repeat(${sd.ncols}, 1fr)`;
    sd.style.fontSize = `${Math.max(50 / sd.ncols, 1)}vh`;
}

/**
 * Adds one score tile to the score grid.
 */
function upScore() {
    let sd = document.getElementById("score-div") as ScoreDiv;
    let color = COLOR_SET[sd.childElementCount];
    if (color === undefined) {
        color = "#000000";
    }
    const id = generateID();
    const te = document.createElement("template");
    te.innerHTML = `
<div class="flex justify-center items-center relative" style="background-color: ${color}" dataid="${id}">
    <p id="${id}" class="absolute" style="color: white; mix-blend-mode: difference;">0</p>
    <div class="absolute grid w-full h-full" style="grid-template-columns: repeat(2, 1fr);">
        <button class="flex-grow" onclick="downtickHandler(event, '${id}');"></button>
        <button class="flex-grow" onclick="uptickHandler(event, '${id}');"></button>
    </div>
</div>
`;
    // @ts-ignore; this one is actually my fault, I don't know the difference between Element and HTMLElement.
    const newChild = te.content.children[0] as ScoreTile;
    newChild.tileIndex = sd.childElementCount;
    newChild.bw__prevChild = sd.bw__lastChild;
    sd.bw__lastChild = newChild;
    sd.appendChild(newChild);
    adjustGrid(sd);
}

/**
 * Reduces the number of score tiles by 1.
 */
function downScore() {
    let sd = document.getElementById("score-div") as HTMLElement & {bw__lastChild: HTMLElement};
    const toRemove = sd.bw__lastChild;
    if (toRemove === null) { return; }
    // @ts-ignore; prevChild will also have a prevChild, not worth type annotating.
    sd.bw__lastChild = sd.bw__lastChild.bw__prevChild;
    toRemove.remove();
    adjustGrid(sd);
}

/**
 * Sets all score tiles to 0.
 */
function zeroScore() {
    for (const c of new ScoreTileIterator()) {
        const did: string = c.getAttribute("dataid");
        const de = document.getElementById(did);
        de.innerText = "0";
    }
}

/**
 * Generates uuid. 128 bits of randomness encoded as hex.
 */
function generateID(): string {
    let u = new Uint32Array(4);
    window.crypto.getRandomValues(u);
    // @ts-ignore; ts being silly, reduce can return whatever it wants to.
    return u.reduce((p: string, c: number) => {return p + c.toString(16).padStart(8, '0');});
}

/**
 * Initializes custom data in the DOM.
 */
function start() {
    let sd = document.getElementById("score-div") as HTMLElement & {bw__lastChild: HTMLElement; ncols: number};
    sd.ncols = 0;
    sd.bw__lastChild = null;
    loadScores();
}

function storeScores() {
    let e = null;
    for (const c of new ScoreTileIterator()) {
        e = {
            score: new ScoreField(c).get(),
            index: c.tileIndex,
            next: e
        }
    }
    localStorage.setItem("scores", JSON.stringify(e));
}

function loadScores() {
    const s = localStorage.getItem("scores");
    if (!s) {
        defaultLayout();
    }
    let e = JSON.parse(s) as ScoreEntry;
    let sd = document.getElementById("score-div") as ScoreDiv;
    while (e !== null) {
        upScore();
        new ScoreField(sd.bw__lastChild).set(e.score);
        e = e.next
    }
}

function defaultLayout() {
    for (let i = 0; i < 4; i++)
        upScore();
}
