import { createDigitValidator } from "./digit.js";
import { isValidGuess } from "./valid.js";
import { evaluateGuess } from "./evaluate.js";
import { generateSecret } from "./secret.js";
import { countPossibleSecrets } from "./count.js";
const storageKey = "bulls-and-cows-records";
let game = null;
let records = [];
try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (Array.isArray(saved))
        records = saved.filter((item) => item &&
            ["attempts", "seconds", "length", "base"].every((key) => Number.isFinite(item[key])));
}
catch {
    /* Storage may be unavailable or invalid. */
}
const app = document.createElement("main");
app.className = "app";
document.body.append(app);
const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined)
        node.textContent = text;
    if (className)
        node.className = className;
    return node;
};
const button = (text) => {
    const node = element("button", text);
    node.type = "button";
    return node;
};
function render() {
    app.replaceChildren();
    const masthead = element("header", undefined, "masthead");
    masthead.append(element("span", "БЫКИ И КОРОВЫ", "brand"), element("span", "Игра на сообразительность", "edition"));
    const hero = element("div", undefined, "hero");
    const heroCopy = element("div", undefined, "hero-copy");
    heroCopy.append(element("p", "СЫГРАЕМ?", "eyebrow"), element("h1", "Быки и коровы"), element("p", "Загадано число с неповторяющимися цифрами. Попробуйте угадать его за как можно меньше попыток.", "intro"));
    const symbol = element("div", undefined, "hero-symbol");
    symbol.setAttribute("aria-hidden", "true");
    symbol.append(element("span", "?"), element("small", "ЧТО ЗАГАДАНО?"));
    hero.append(heroCopy, symbol);
    const rules = element("aside", undefined, "rules");
    rules.append(element("span", "КАК ИГРАТЬ", "rules-title"), element("p", "Бык — цифра на своём месте."), element("p", "Корова — верная цифра, но не на своём месте."));
    app.append(masthead, hero, rules);
    const board = element("div", undefined, "board");
    app.append(board);
    const card = element("section", undefined, "card");
    board.append(card);
    if (!game) {
        card.append(element("p", "НАЧНЁМ С НАСТРОЕК", "section-index"), element("h2", "Новая игра"), element("p", "Выберите параметры секретного числа.", "muted"));
        const form = element("form");
        const baseLabel = element("label", "Система счисления");
        const base = element("select");
        [
            [2, "Двоичная · 0–1"],
            [8, "Восьмеричная · 0–7"],
            [10, "Десятичная · 0–9"],
            [16, "Шестнадцатеричная · 0–9, A–F"],
        ].forEach(([value, title]) => {
            const option = element("option", String(title));
            option.value = String(value);
            option.selected = value === 10;
            base.append(option);
        });
        baseLabel.append(base);
        const lengthLabel = element("label", "Количество цифр");
        const length = element("select");
        for (let i = 2; i <= 6; i++) {
            const option = element("option", String(i));
            option.value = String(i);
            option.selected = i === 4;
            length.append(option);
        }
        lengthLabel.append(length);
        const combinations = element("p", "", "muted");
        const update = () => {
            Array.from(length.options).forEach((option) => {
                option.disabled = Number(option.value) > Number(base.value);
            });
            if (Number(length.value) > Number(base.value))
                length.value = "2";
            combinations.textContent = `Возможных чисел: ${countPossibleSecrets(Number(length.value), Number(base.value)).toLocaleString("ru-RU")}`;
        };
        base.addEventListener("change", update);
        length.addEventListener("change", update);
        update();
        const start = element("button", "Начать игру");
        start.type = "submit";
        form.append(baseLabel, lengthLabel, combinations, start);
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const size = Number(length.value);
            const radix = Number(base.value);
            game = {
                secret: generateSecret(size, radix),
                length: size,
                base: radix,
                started: Date.now(),
                history: [],
                won: false,
            };
            render();
        });
        card.append(form);
    }
    else {
        const current = game;
        card.append(element("p", "ИГРАЕМ", "section-index"), element("h2", current.won ? "Вы угадали!" : "Ваша попытка"), element("p", `${current.length} цифры · основание ${current.base}`, "muted"));
        if (current.won)
            card.append(element("p", `Число ${current.secret.toUpperCase()} угадано за ${current.history.length} попыток.`, "success"));
        else {
            const form = element("form");
            const label = element("label", "Введите число");
            const input = element("input");
            input.autocomplete = "off";
            input.maxLength = current.length;
            input.placeholder = "Например, 0123";
            const error = element("p", "", "error");
            error.setAttribute("role", "alert");
            input.addEventListener("input", () => {
                input.value = [...input.value]
                    .filter(createDigitValidator(current.base))
                    .join("");
                error.textContent = "";
            });
            label.append(input);
            const submit = element("button", "Проверить");
            submit.type = "submit";
            form.append(label, error, submit);
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const value = input.value.toLowerCase();
                if (!isValidGuess(value, current.length, current.base)) {
                    error.textContent = `Введите ${current.length} разных допустимых цифр.`;
                    return;
                }
                if (current.history.some((entry) => entry.value === value)) {
                    error.textContent = "Эта попытка уже была.";
                    return;
                }
                const result = evaluateGuess(current.secret, value);
                const history = [...current.history, { value, ...result }];
                const won = result.bulls === current.length;
                game = { ...current, history, won };
                if (won) {
                    records = [
                        ...records,
                        {
                            attempts: history.length,
                            seconds: Math.floor((Date.now() - current.started) / 1000),
                            length: current.length,
                            base: current.base,
                        },
                    ]
                        .sort((a, b) => a.attempts - b.attempts || a.seconds - b.seconds)
                        .slice(0, 10);
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(records));
                    }
                    catch {
                        /* Continue playing when storage is unavailable. */
                    }
                }
                render();
            });
            card.append(form);
            setTimeout(() => input.focus(), 0);
        }
        if (current.history.length) {
            card.append(element("h3", "История попыток"));
            const list = element("ol", undefined, "history");
            current.history.forEach((entry) => {
                const row = element("li");
                row.append(element("strong", entry.value.toUpperCase()), element("span", `Быки: ${entry.bulls} · Коровы: ${entry.cows}`));
                list.append(row);
            });
            card.append(list);
        }
        const reset = button("Новая игра");
        reset.className = "secondary";
        reset.addEventListener("click", () => {
            game = null;
            render();
        });
        card.append(reset);
    }
    const scores = element("section", undefined, "card scores");
    scores.append(element("p", "ЛУЧШИЕ РЕЗУЛЬТАТЫ", "section-index"), element("h2", "Рекорды"), element("p", "Лучшие результаты по числу попыток и времени.", "muted"));
    if (!records.length)
        scores.append(element("p", "Пока нет результатов. Сыграйте первую партию!", "empty"));
    else {
        const list = element("ol", undefined, "history");
        records.forEach((record) => {
            const row = element("li");
            row.append(element("strong", `${record.attempts} попыток · ${record.seconds} с`), element("span", `${record.length} цифр · основание ${record.base}`));
            list.append(row);
        });
        scores.append(list);
    }
    board.append(scores);
}
render();
