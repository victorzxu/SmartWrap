/**
 * Created by Xiao Liang Yu <me@hiubright.com>
 */

const context = typeof browser === 'undefined' ? chrome : browser;
var spnum = 1;
context.browserAction.onClicked.addListener(()=>{
  context.tabs.executeScript({
    file:'scripts/browser_action.js',
    runAt:'document_idle'
  });
});
