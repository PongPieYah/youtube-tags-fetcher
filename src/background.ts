import { TagElement } from './types';

/**
 * カンマ区切りのタグをクリップボードにコピーする。
 */
const copy = () => {
  const tags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'))
    .filter((e): e is TagElement => 'content' in e)
    .map((e) => e.content);
  const type = 'text/plain';
  // join はデフォルトでカンマ区切りになる
  const text = tags.join();
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  navigator.clipboard.write(data).then(() => alert(chrome.i18n.getMessage('copyComplete')));
};

/**
 * タグを羅列したダイアログを表示する。
 */
const show = () => {
  const dialogId = 'tag-dialog';

  /**
   * ダイアログのヘッダを作成する
   * @param dialog ダイアログ要素
   * @param tags タグの配列
   * @returns ダイアログのヘッダ div
   */
  const createDialogHeader = (dialog: HTMLDialogElement, tags: string[]): HTMLDivElement => {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tag-dialog-header';

    // ダイアログのタイトル
    const titleDiv = document.createElement('div');
    const p = document.createElement('p');
    p.innerHTML = chrome.i18n.getMessage('tagList');
    p.className = 'tag-dialog-title';
    titleDiv.appendChild(p);
    headerDiv.appendChild(titleDiv);

    const btnDiv = document.createElement('div');

    // コピーボタン
    const copyBtn = document.createElement('button');
    copyBtn.textContent = chrome.i18n.getMessage('copyBtnTxt');
    copyBtn.className = 'tag-dialog-btn blue';
    copyBtn.addEventListener('click', () => {
      const type = 'text/plain';
      const text = tags.join();
      const blob = new Blob([text], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data).then(() => {
        dialog.close();
        alert(chrome.i18n.getMessage('copyComplete'));
      });
    });
    btnDiv.appendChild(copyBtn);

    // 閉じるボタン
    const closeBtn = document.createElement('button');
    closeBtn.textContent = chrome.i18n.getMessage('closeBtnTxt');
    closeBtn.className = 'tag-dialog-btn gray';
    closeBtn.addEventListener('click', () => {
      dialog.close();
    });
    btnDiv.appendChild(closeBtn);

    headerDiv.appendChild(btnDiv);

    return headerDiv;
  };

  /**
   * タグを羅列したダイアログを作成する。
   * @returns ダイアログ
   */
  const createDialog = (): HTMLDialogElement => {
    const tags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'))
      .filter((e): e is TagElement => 'content' in e)
      .map((e) => e.content);

    const dialog = document.createElement('dialog');
    dialog.id = dialogId;

    dialog.appendChild(createDialogHeader(dialog, tags));

    const ul = document.createElement('ul');
    ul.className = 'tag-list-group';
    tags.forEach((e) => {
      const li = document.createElement('li');
      li.innerHTML = e;
      ul.appendChild(li);
    });
    dialog.appendChild(ul);

    return dialog;
  };

  let dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
  // ダイアログが作成済でない場合は作成し document.body に追加
  if (!dialog) {
    dialog = createDialog();
    document.body.appendChild(dialog);
  }

  // モーダルダイアログを表示
  dialog.showModal();
};

// 初回インストール時にコンテキストメニューを追加
chrome.runtime.onInstalled.addListener(() => {
  const parent = chrome.contextMenus.create({
    id: 'get',
    title: chrome.i18n.getMessage('get'),
    contexts: ['all'],
    documentUrlPatterns: ['https://www.youtube.com/watch?v=*', 'https://www.youtube.com/shorts/*'],
  });

  chrome.contextMenus.create({
    parentId: parent,
    id: 'copy',
    title: chrome.i18n.getMessage('copy'),
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    parentId: parent,
    id: 'show',
    title: chrome.i18n.getMessage('show'),
    contexts: ['all'],
  });
});

// コンテキストメニューのクリックイベントを付与
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  switch (info.menuItemId) {
    case 'copy':
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copy,
      });
      break;
    case 'show':
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: show,
      });
      break;
  }
});
