let openMailModalBtn = document.querySelector('.write-letter-btn');
let writeLetterModalWrapper = document.querySelector('.write-letter-wrapper');
let jsonData;
//В магазине гора яблок. Купи семь килограмм и шоколадку
function getFile(fileName) {
    let request = new XMLHttpRequest();
    request.open('GET', fileName);
    request.onloadend = function () {
        parse(request.responseText);
    };
    request.send();
};
getFile('public/blacklist1.json');
function parse(obj) {
    jsonData = JSON.parse(obj);
};
let dropdownMenu = (e) => {
    let dropdownLink = e.target.closest(".dropdown-link");
    if (dropdownLink) {
        if (dropdownLink.parentNode.className.includes("dropdown-hide")) {
            dropdownLink.parentNode.classList.remove("dropdown-hide");
            dropdownLink.querySelector("i:last-child").classList.remove("open");
            dropdownLink.querySelector("i:last-child").classList.add("closet");
        } else {
            dropdownLink.parentNode.classList.add("dropdown-hide");
            dropdownLink.querySelector("i:last-child").classList.remove("closet");
            dropdownLink.querySelector("i:last-child").classList.add("open");
        }
    }
};
document.addEventListener('click', dropdownMenu);
openMailModalBtn.addEventListener('click', () => {
    writeLetterModalWrapper.classList.remove("hide");
});
writeLetterModalWrapper.addEventListener('click', (e) => {
    if (e.target == writeLetterModalWrapper) {
        writeLetterModalWrapper.classList.add("hide");
    }
});
let users = [{
    name: "Користувач 1",
}, {
    name: "Користувач 2",
}];
let sendLetterBtn = document.querySelector(".modal-write-letter .send-letter-btn");
let switchAccounts = document.querySelectorAll(".accounts-menu ul li");
let firstUserSentArr = [];
let secondUserReceiverArr = [];
let secondUserSentArr = [];
let firstUserReceiverArr = [];
let pinImgBtn = document.querySelector(".modal-write-letter .chooseImg");
let imgSrc;
function leave() {
    setTimeout(function () {
        imgSrc = `public/img/${pinImgBtn.files[0].name}`;
        document.querySelector(".pinned-img img").src = imgSrc;
        document.querySelector(".deleteImg").classList.remove("hide");
        function recognize(file, lang, logger) {
            return Tesseract.recognize(file, lang, { logger }).
                then(({ data: { text } }) => {
                    return text;
                });
        };
        const log = document.querySelector('.log');
        function updateProgress(data) {
            log.innerHTML = "";
            const statusText = document.createTextNode(data.status);
            const progress = document.createElement('progress');
            progress.max = 1;
            progress.value = data.progress;
            log.appendChild(statusText);
            log.appendChild(progress);
        };
        function setResult(text) {
            log.innerHTML = '';
            text = text.replace(/\n\s*\n/g, '\n');
            const pre = document.createElement('pre');
            pre.innerHTML = text;
            log.appendChild(pre);
        };
        const file = pinImgBtn.files[0];
        if (!file) return;
        const lang = document.getElementById("langs").value;
        recognize(file, lang, updateProgress).then(setResult);
        document.body.removeEventListener('focusin', leave);
    }, 100);
};
pinImgBtn.addEventListener('click', () => {
    document.body.addEventListener('focusin', leave);
});
document.querySelector(".deleteImg").addEventListener("click", () => {
    document.querySelector(".deleteImg").classList.add("hide");
    document.querySelector(".pinned-img img").src = "";
});
sendLetterBtn.addEventListener("click", () => {
    if (Number(document.querySelector(".buttons .name-of-user span").textContent) - 1 === 0) {
        let time = new Date().getHours();
        time = `${time}:${new Date().getMinutes()}`;
        let newSentLetter = new Object();
        newSentLetter.theme = document.querySelector(".modal-write-letter textarea:nth-child(2)").value;
        newSentLetter.text = document.querySelector(".modal-write-letter textarea:nth-child(3)").value;
        newSentLetter.time = time;
        if (imgSrc) {
            newSentLetter.img = `public/img/${pinImgBtn.files[0].name}`;
        } else {
            newSentLetter.img = "";
        };
        users[0].sentLetter = newSentLetter;
        let newReceiverLetter = new Object();
        newReceiverLetter = users[0].sentLetter;
        users[1].receivedLetter = newReceiverLetter;
        let formulatedText;
        let formulatedTextWithoutSpamNotspamWords;
        function mailFormattingFunc() {
            formulatedText = `${users[0].sentLetter.theme} ${users[0].sentLetter.text} ${document.querySelector('.log pre').textContent}`;
            formulatedText = formulatedText.replace(/\r?\n/g, " ").replace(/[^А-ЯЁA-Zа-яa-z ]/g, " ").toLowerCase();
            for (let i = 0; i < formulatedText.split(' ').length; i++) {
                for (let j = 0; j < jsonData.skipped.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.skipped[j].Key.toLowerCase()) {
                        let regex = new RegExp(` ${formulatedText.split(' ')[i]} `);
                        formulatedText = formulatedText.replace(regex, ' ');
                    };
                };
            };
            formulatedText = formulatedText.replace(/ {1,}/g, " ");
        };
        mailFormattingFunc();
        function naiveBayesClassifier() {
            let valueArray = [
                {},
            ];
            let counter = 0;
            for (let i = 0; i < formulatedText.split(' ').length; i++) {
                for (let j = 0; j < jsonData.spam.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.spam[j].Key.toLowerCase()) {
                        valueArray[counter] = new Object();
                        valueArray[counter].word = jsonData.spam[j].Key.toLowerCase();
                        valueArray[counter].count = jsonData.spam[j].Value + 1;
                        valueArray[counter].belonging = "spam";
                        counter += 1;
                    };
                };
                for (let j = 0; j < jsonData.notspam.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.notspam[j].Key.toLowerCase()) {
                        if (valueArray.find(arr => arr.word === formulatedText.split(' ')[i])) {
                            if (formulatedText.split(' ')[i] == valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).word) {
                                valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).count = valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).count + 1;
                                valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).belonging = "both";
                            };
                        } else {
                            valueArray[counter] = new Object();
                            valueArray[counter].word = jsonData.notspam[j].Key.toLowerCase();
                            valueArray[counter].count = jsonData.notspam[j].Value + 1;
                            valueArray[counter].belonging = "notspam";
                            counter += 1;
                        };
                    };
                };
                formulatedTextWithoutSpamNotspamWords = formulatedText;
                for (let i = 0; i < valueArray.length; i++) {
                    formulatedTextWithoutSpamNotspamWords = formulatedTextWithoutSpamNotspamWords.replace(valueArray[i].word, '');
                };
            };
            for (let i = 0; i < formulatedTextWithoutSpamNotspamWords.split(' ').length; i++) {
                if (formulatedTextWithoutSpamNotspamWords.split(' ')[i] != "") {
                    valueArray[counter] = new Object();
                    valueArray[counter].word = formulatedText.split(' ')[i];
                    valueArray[counter].count = 1;
                    valueArray[counter].belonging = "neither";
                    counter += 1;
                };
            };
            let countOfDictionary = 0;
            for (let index = 0; index < valueArray.length; index++) {
                if (valueArray[index].count > 1) {
                    countOfDictionary += 1;
                };
            };
            countOfDictionary = jsonData.notspam.length + jsonData.spam.length - countOfDictionary;                     // количество слов в словаре. если повторяются, то считаются за одно слово;
            let spamProbability;
            let spamProbabilityFunc = function () {
                spamProbability = 1;
                for (let index = 0; index < valueArray.length; index++) {
                    if (valueArray[index].belonging == "both" || valueArray[index].belonging == "spam") {
                        spamProbability *= 2 / (countOfDictionary + jsonData.spam.length);
                    };
                    if (valueArray[index].belonging == "notspam" || valueArray[index].belonging == "neither") {
                        spamProbability *= 1 / (countOfDictionary + jsonData.spam.length);
                    };
                };
                spamProbability = ((valueArray.length / countOfDictionary) * spamProbability);

            };
            spamProbabilityFunc();
            let notSpamProbability;
            let notSpamProbabilityFunc = function () {
                notSpamProbability = 1;
                for (let index = 0; index < valueArray.length; index++) {
                    if (valueArray[index].belonging == "both" || valueArray[index].belonging == "notspam") {
                        notSpamProbability *= 2 / (countOfDictionary + jsonData.notspam.length);
                    };
                    if (valueArray[index].belonging == "spam" || valueArray[index].belonging == "neither") {
                        notSpamProbability *= 1 / (countOfDictionary + jsonData.notspam.length);
                    };
                };
                notSpamProbability = ((valueArray.length / countOfDictionary) * notSpamProbability);
                if (spamProbability > notSpamProbability) {
                    firstUserSentArr.push(`|checkedSpamSpam|checkedSpam/thema${users[0].sentLetter.theme}/thema${users[0].sentLetter.text}\\img${users[0].sentLetter.img}\\img`);
                    secondUserReceiverArr = firstUserSentArr;
                } else {
                    firstUserSentArr.push(`|checkedSpamNotSpam|checkedSpam/thema${users[0].sentLetter.theme}/thema${users[0].sentLetter.text}\\img${users[0].sentLetter.img}\\img`);
                    secondUserReceiverArr = firstUserSentArr;
                };
            };
            notSpamProbabilityFunc();
            let result;
            console.log("Вірогідність Спаму: " + spamProbability)
            console.log("Вірогідність НеСпаму: " + notSpamProbability)
            if (spamProbability > notSpamProbability) {
                result = true;
            } else {
                result = false;
            };
            return result;
        };
        naiveBayesClassifier();
        document.querySelector(".modal-write-letter textarea:nth-child(1)").value = "";
        document.querySelector(".modal-write-letter textarea:nth-child(2)").value = "";
        document.querySelector(".modal-write-letter textarea:nth-child(3)").value = "";
        window.alert("Відправлено");
    } else {
        let time = new Date().getHours();
        time = `${time}:${new Date().getMinutes()}`;
        let newSentLetter = new Object();
        newSentLetter.theme = document.querySelector(".modal-write-letter textarea:nth-child(2)").value;
        newSentLetter.text = document.querySelector(".modal-write-letter textarea:nth-child(3)").value;
        newSentLetter.time = time;
        if (imgSrc) {
            newSentLetter.img = `public/img/${pinImgBtn.files[0].name}`;
        } else {
            newSentLetter.img = "";
        }
        users[1].sentLetter = newSentLetter;
        let newReceiverLetter = new Object();
        newReceiverLetter = users[1].sentLetter;
        users[0].receivedLetter = newReceiverLetter;
        let formulatedText;
        let formulatedTextWithoutSpamNotspamWords;
        function mailFormattingFunc() {
            formulatedText = `${users[0].sentLetter.theme} ${users[0].sentLetter.text}`;
            formulatedText = formulatedText.replace(/\r?\n/g, " ").replace(/[^А-ЯЁA-Zа-яa-z ]/g, " ").toLowerCase();
            for (let i = 0; i < formulatedText.split(' ').length; i++) {
                for (let j = 0; j < jsonData.skipped.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.skipped[j].Key.toLowerCase()) {
                        let regex = new RegExp(` ${formulatedText.split(' ')[i]} `);
                        formulatedText = formulatedText.replace(regex, ' ');
                    };
                };
            };
            formulatedText = formulatedText.replace(/ {1,}/g, " ");
        };
        mailFormattingFunc();
        function naiveBayesClassifier() {
            let valueArray = [
                {},
            ];
            let counter = 0;
            for (let i = 0; i < formulatedText.split(' ').length; i++) {
                for (let j = 0; j < jsonData.spam.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.spam[j].Key.toLowerCase()) {
                        valueArray[counter] = new Object();
                        valueArray[counter].word = jsonData.spam[j].Key.toLowerCase();
                        valueArray[counter].count = jsonData.spam[j].Value + 1;
                        valueArray[counter].belonging = "spam";
                        counter += 1;
                    };
                };
                for (let j = 0; j < jsonData.notspam.length; j++) {
                    if (formulatedText.split(' ')[i] == jsonData.notspam[j].Key.toLowerCase()) {
                        if (valueArray.find(arr => arr.word === formulatedText.split(' ')[i])) {
                            if (formulatedText.split(' ')[i] == valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).word) {
                                valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).count = valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).count + 1;
                                valueArray.find(arr => arr.word === formulatedText.split(' ')[i]).belonging = "both";
                            };
                        } else {
                            valueArray[counter] = new Object();
                            valueArray[counter].word = jsonData.notspam[j].Key.toLowerCase();
                            valueArray[counter].count = jsonData.notspam[j].Value + 1;
                            valueArray[counter].belonging = "notspam";
                            counter += 1;
                        };
                    };
                };
                formulatedTextWithoutSpamNotspamWords = formulatedText;
                for (let i = 0; i < valueArray.length; i++) {
                    formulatedTextWithoutSpamNotspamWords = formulatedTextWithoutSpamNotspamWords.replace(valueArray[i].word, '');
                };
            };
            for (let i = 0; i < formulatedTextWithoutSpamNotspamWords.split(' ').length; i++) {
                if (formulatedTextWithoutSpamNotspamWords.split(' ')[i] != "") {
                    valueArray[counter] = new Object();
                    valueArray[counter].word = formulatedText.split(' ')[i];
                    valueArray[counter].count = 1;
                    valueArray[counter].belonging = "neither";
                    counter += 1;
                };
            };
            let countOfDictionary = 0;
            for (let index = 0; index < valueArray.length; index++) {
                if (valueArray[index].count > 1) {
                    countOfDictionary += 1;
                };
            };
            countOfDictionary = jsonData.notspam.length + jsonData.spam.length - countOfDictionary;                     // количество слов в словаре. если повторяются, то считаются за одно слово;
            let spamProbability;
            let spamProbabilityFunc = function () {
                spamProbability = 1;
                for (let index = 0; index < valueArray.length; index++) {
                    if (valueArray[index].belonging == "both" || valueArray[index].belonging == "spam") {
                        spamProbability *= 2 / (countOfDictionary + jsonData.spam.length);
                    };
                    if (valueArray[index].belonging == "notspam" || valueArray[index].belonging == "neither") {
                        spamProbability *= 1 / (countOfDictionary + jsonData.spam.length);
                    };
                };
                spamProbability = ((valueArray.length / countOfDictionary) * spamProbability);
            };

            spamProbabilityFunc();
            let notSpamProbability;
            let notSpamProbabilityFunc = function () {
                notSpamProbability = 1;
                for (let index = 0; index < valueArray.length; index++) {
                    if (valueArray[index].belonging == "both" || valueArray[index].belonging == "notspam") {
                        notSpamProbability *= 2 / (countOfDictionary + jsonData.spam.length);
                    };
                    if (valueArray[index].belonging == "spam" || valueArray[index].belonging == "neither") {
                        notSpamProbability *= 1 / (countOfDictionary + jsonData.spam.length);
                    };
                };
                notSpamProbability = ((valueArray.length / countOfDictionary) * notSpamProbability);
                if (spamProbability > notSpamProbability) {
                    firstUserSentArr.push(`|checkedSpamSpam|checkedSpam/thema${users[0].sentLetter.theme}/thema ${users[0].sentLetter.text} \\img${users[0].sentLetter.img}\\img`);
                    secondUserReceiverArr = firstUserSentArr;
                } else {
                    firstUserSentArr.push(`|checkedSpamNotSpam|checkedSpam/thema${users[0].sentLetter.theme}/thema ${users[0].sentLetter.text} \\img${users[0].sentLetter.img}\\img`);
                    secondUserReceiverArr = firstUserSentArr;
                };
            };
            notSpamProbabilityFunc();
            console.log("Вірогідність Спаму: " + spamProbability)
            console.log("Вірогідність НеСпаму: " + notSpamProbability)
            let result;
            if (spamProbability > notSpamProbability) {
                result = true;
            } else {
                result = false;
            };
            return result;
        };
        naiveBayesClassifier();
        document.querySelector(".modal-write-letter textarea:nth-child(1)").value = "";
        document.querySelector(".modal-write-letter textarea:nth-child(2)").value = "";
        document.querySelector(".modal-write-letter textarea:nth-child(3)").value = "";
        window.alert("Відправлено");
    };
});
let letterList = document.querySelector(".letter-list ul");
let letterListLetter = letterList.querySelectorAll("li");
let generalBlockLetter = document.querySelector(".general-block-letter");
let mainText = [], thema = [], img = [];
switchAccounts.forEach((item, index) => {
    item.addEventListener('click', e => {
        document.querySelector(".buttons .name-of-user span").textContent = users[index].name.replace("Користувач", "");
        document.querySelector('.search-wrapper p:first-child').textContent = "Поштова скринька";
        letterList.innerHTML = "";
        if (users[index].name === "Користувач 1") {
            if (firstUserReceiverArr.length >= document.querySelectorAll(".letter-list ul li").length + 1) {
                for (let index = 0; index < firstUserReceiverArr.length; index++) {
                    if (firstUserReceiverArr[index].match(/\|checkedSpam(.*)\|checkedSpam/)[1] === "NotSpam") {
                        mainText[index] = firstUserReceiverArr[index].replace(/\/thema.*?\/thema/g, "").replace(/\\img.*?\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                        thema[index] = firstUserReceiverArr[index].replace(mainText[index], '').replace(/\\img.*?\\img/g, '').replace(/\/thema/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                        img[index] = firstUserReceiverArr[index].replace(mainText[index], '').replace(/\/thema.*?\/thema/g, '').replace(/\\img/g, "");
                        let closedLetter = document.createElement('li');
                        closedLetter.className = index;
                        letterList.append(closedLetter);
                        let userIcon = document.createElement('div');
                        userIcon.className = "user-icon";
                        closedLetter.append(userIcon);
                        let icon = document.createElement('i');
                        icon.className = "material-icons";
                        icon.innerHTML = "person";
                        userIcon.append(icon);
                        let messageInformation = document.createElement('div');
                        messageInformation.className = "message-information";
                        closedLetter.append(messageInformation);
                        let author = document.createElement('p');
                        author.className = "author";
                        author.innerHTML = 'Користувач 2';
                        messageInformation.append(author);
                        let theme = document.createElement('p');
                        theme.className = "theme";
                        theme.innerHTML = thema[index];
                        messageInformation.append(theme);
                        let message = document.createElement('p');
                        message.className = "message";
                        message.innerHTML = mainText[index];
                        messageInformation.append(message);
                        let messageTime = document.createElement('div');
                        messageTime.className = "message-time";
                        messageTime.innerHTML = "13PM";
                        closedLetter.append(messageTime);
                        let horizontalLine = document.createElement('div');
                        horizontalLine.className = "horizontal-line";
                        letterList.append(horizontalLine);
                        letterListLetter = letterList.querySelectorAll("li");
                    };
                };
            };
        } else {
            if (secondUserReceiverArr.length >= document.querySelectorAll(".letter-list ul li").length + 1) {
                for (let index = 0; index < secondUserReceiverArr.length; index++) {
                    if (secondUserReceiverArr[index].match(/\|checkedSpam(.*)\|checkedSpam/)[1] === "NotSpam") {
                        mainText[index] = secondUserReceiverArr[index].replace(/\/thema.*?\/thema/g, "").replace(/\\img.*?\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                        thema[index] = secondUserReceiverArr[index].replace(mainText[index], '').replace(/\\img.*?\\img/g, '').replace(/\/thema/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                        img[index] = secondUserReceiverArr[index].replace(mainText[index], '').replace(/\/thema.*?\/thema/g, '').replace(/\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                        let closedLetter = document.createElement('li');
                        closedLetter.className = index;
                        letterList.append(closedLetter);
                        let userIcon = document.createElement('div');
                        userIcon.className = "user-icon";
                        closedLetter.append(userIcon);
                        let icon = document.createElement('i');
                        icon.className = "material-icons";
                        icon.innerHTML = "person";
                        userIcon.append(icon);
                        let messageInformation = document.createElement('div');
                        messageInformation.className = "message-information";
                        closedLetter.append(messageInformation);
                        let author = document.createElement('p');
                        author.className = "author";
                        author.innerHTML = 'Користувач 1';
                        messageInformation.append(author);
                        let theme = document.createElement('p');
                        theme.className = "theme";
                        theme.innerHTML = thema[index];
                        messageInformation.append(theme);
                        let message = document.createElement('p');
                        message.className = "message";
                        message.innerHTML = mainText[index];
                        messageInformation.append(message);
                        let messageTime = document.createElement('div');
                        messageTime.className = "message-time";
                        messageTime.innerHTML = "13PM";
                        closedLetter.append(messageTime);
                        let horizontalLine = document.createElement('div');
                        horizontalLine.className = "horizontal-line";
                        letterList.append(horizontalLine);
                        letterListLetter = letterList.querySelectorAll("li");
                    };
                };
            };
        };
    });
});
document.addEventListener("click", e => {
    if (e.target.closest(".letter-list ul li")) {
        generalBlockLetter.innerHTML = "";
        let letterInfoBlock = document.createElement('div');
        letterInfoBlock.className = "letter-info-block";
        generalBlockLetter.append(letterInfoBlock);
        let receiverUserIcon = document.createElement('div');
        receiverUserIcon.className = "receiver-user-icon";
        letterInfoBlock.append(receiverUserIcon);
        let userIcon = document.createElement('i');
        userIcon.className = "material-icons";
        userIcon.innerHTML = "person";
        receiverUserIcon.append(userIcon);
        let messageInfo = document.createElement('div');
        messageInfo.className = "message-info";
        letterInfoBlock.append(messageInfo);
        let receiverUserName = document.createElement('p');
        receiverUserName.className = "receiver-user-name";
        if (Number(document.querySelector(".name-of-user span").textContent) == 2) {
            receiverUserName.innerHTML = `Користувач 1`;
        } else {
            receiverUserName.innerHTML = `Користувач 2`;
        };
        messageInfo.append(receiverUserName);
        let fromTo = document.createElement('p');
        fromTo.className = "from-to";
        if (Number(document.querySelector(".name-of-user span").textContent) == 2) {
            fromTo.innerHTML = `від: <span>Користувач 1</span> до: <span>Користувач 2</span>`;
        } else {
            fromTo.innerHTML = `від: <span>Користувач 2</span> до: <span>Користувач 1</span>`;
        };
        messageInfo.append(fromTo);
        let letterTime = document.createElement('div');
        letterTime.className = "letter-time";
        letterInfoBlock.append(letterTime);
        let letterTimeP = document.createElement('p');                                  // добавить дату;
        letterTimeP.innerHTML = "08 Січня";
        letterTime.append(letterTimeP);
        let receiverLetter = document.createElement('div');
        receiverLetter.className = "receiver-letter";
        generalBlockLetter.append(receiverLetter);
        let receiverLetterTheme = document.createElement('div');
        receiverLetterTheme.className = "receiver-letter-theme";
        receiverLetter.append(receiverLetterTheme);
        let receiverLetterThemeP = document.createElement('p');
        receiverLetterThemeP.innerHTML = thema[Number(e.target.closest(".letter-list ul li").className)];
        receiverLetterTheme.append(receiverLetterThemeP);
        let receiverLetterMaintext = document.createElement('div');
        receiverLetterMaintext.className = "receiver-letter-maintext";
        receiverLetter.append(receiverLetterMaintext);
        let receiverLetterMaintextP = document.createElement('p');
        receiverLetterMaintextP.innerHTML = mainText[Number(e.target.closest(".letter-list ul li").className)];
        receiverLetterMaintext.append(receiverLetterMaintextP);
        let receiverLetterPicture = document.createElement('div');
        receiverLetterPicture.className = "receiver-letter-picture";
        receiverLetter.append(receiverLetterPicture);
        let receiverLetterPictureImg = document.createElement('img');
        receiverLetterPictureImg.src = img[Number(e.target.closest(".letter-list ul li").className)];
        receiverLetterPicture.append(receiverLetterPictureImg);
    };
});
let checkSpam = document.querySelector(".side-menu .spam-bin");
checkSpam.addEventListener('click', () => {
    document.querySelector('.search-wrapper p:first-child').textContent = "Спам";
    letterList.innerHTML = "";
    if (Number(document.querySelector(".name-of-user span").textContent) == 1) {
        if (firstUserReceiverArr.length >= document.querySelectorAll(".letter-list ul li").length + 1) {
            for (let index = 0; index < firstUserReceiverArr.length; index++) {
                if (firstUserReceiverArr[index].match(/\|checkedSpam(.*)\|checkedSpam/)[1] === "Spam") {
                    mainText[index] = firstUserReceiverArr[index].replace(/\/thema.*?\/thema/g, "").replace(/\\img.*?\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    thema[index] = firstUserReceiverArr[index].replace(mainText[index], '').replace(/\\img.*?\\img/g, '').replace(/\/thema/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    img[index] = firstUserReceiverArr[index].replace(mainText[index], '').replace(/\/thema.*?\/thema/g, '').replace(/\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    let closedLetter = document.createElement('li');
                    closedLetter.className = index;
                    letterList.append(closedLetter);
                    let userIcon = document.createElement('div');
                    userIcon.className = "user-icon";
                    closedLetter.append(userIcon);
                    let icon = document.createElement('i');
                    icon.className = "material-icons";
                    icon.innerHTML = "person";
                    userIcon.append(icon);
                    let messageInformation = document.createElement('div');
                    messageInformation.className = "message-information";
                    closedLetter.append(messageInformation);
                    let author = document.createElement('p');
                    author.className = "author";
                    author.innerHTML = 'Користувач 1';
                    messageInformation.append(author);
                    let theme = document.createElement('p');
                    theme.className = "theme";
                    theme.innerHTML = thema[index];
                    messageInformation.append(theme);
                    let message = document.createElement('p');
                    message.className = "message";
                    message.innerHTML = mainText[index];
                    messageInformation.append(message);
                    let messageTime = document.createElement('div');
                    messageTime.className = "message-time";
                    messageTime.innerHTML = "13PM";
                    closedLetter.append(messageTime);
                    let spamDie = document.createElement('div');
                    spamDie.className = "spam-die";
                    closedLetter.append(spamDie);
                    let spamDieP = document.createElement('p');
                    spamDieP.innerHTML = "Цей лист є спамом";
                    spamDie.append(spamDieP);
                    let horizontalLine = document.createElement('div');
                    horizontalLine.className = "horizontal-line";
                    letterList.append(horizontalLine);
                    letterListLetter = letterList.querySelectorAll("li");
                };
            };
        };
    } else {
        if (secondUserReceiverArr.length >= document.querySelectorAll(".letter-list ul li").length + 1) {
            for (let index = 0; index < secondUserReceiverArr.length; index++) {
                if (secondUserReceiverArr[index].match(/\|checkedSpam(.*)\|checkedSpam/)[1] === "Spam") {
                    mainText[index] = secondUserReceiverArr[index].replace(/\/thema.*?\/thema/g, "").replace(/\\img.*?\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    thema[index] = secondUserReceiverArr[index].replace(mainText[index], '').replace(/\\img.*?\\img/g, '').replace(/\/thema/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    img[index] = secondUserReceiverArr[index].replace(mainText[index], '').replace(/\/thema.*?\/thema/g, '').replace(/\\img/g, "").replace(/\|checkedSpam.*?\|checkedSpam/g, "");
                    let closedLetter = document.createElement('li');
                    closedLetter.className = index;
                    letterList.append(closedLetter);
                    let userIcon = document.createElement('div');
                    userIcon.className = "user-icon";
                    closedLetter.append(userIcon);
                    let icon = document.createElement('i');
                    icon.className = "material-icons";
                    icon.innerHTML = "person";
                    userIcon.append(icon);
                    let messageInformation = document.createElement('div');
                    messageInformation.className = "message-information";
                    closedLetter.append(messageInformation);
                    let author = document.createElement('p');
                    author.className = "author";
                    author.innerHTML = 'Користувач 1';
                    messageInformation.append(author);
                    let theme = document.createElement('p');
                    theme.className = "theme";
                    theme.innerHTML = thema[index];
                    messageInformation.append(theme);
                    let message = document.createElement('p');
                    message.className = "message";
                    message.innerHTML = mainText[index];
                    messageInformation.append(message);
                    let messageTime = document.createElement('div');
                    messageTime.className = "message-time";
                    messageTime.innerHTML = "13PM";
                    closedLetter.append(messageTime);
                    let spamDie = document.createElement('div');
                    spamDie.className = "spam-die";
                    closedLetter.append(spamDie);
                    let spamDieP = document.createElement('p');
                    spamDieP.innerHTML = "Цей лист є спамом";
                    spamDie.append(spamDieP);
                    let horizontalLine = document.createElement('div');
                    horizontalLine.className = "horizontal-line";
                    letterList.append(horizontalLine);
                    letterListLetter = letterList.querySelectorAll("li");
                };
            };
        };
    };
});