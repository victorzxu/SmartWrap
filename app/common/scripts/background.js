/**
 * Created by Xiao Liang Yu <me@hiubright.com>
 */

const context = typeof browser === 'undefined' ? chrome : browser;
var swTab;
function onCreated(windowInfo) {
  swTab = windowInfo;
}
function onError(error) {
  console.log(error);
}
function handleMessage(message,sender,sendResponse) {
  console.log(message);
  if (message.eventName && swTab) {
    if (messaage.eventName == "dragstart_msg") {
      browser.tabs.sendMessage(swTab.id,message);
    }
  }


}
context.browserAction.onClicked.addListener(()=>{
  context.tabs.executeScript({
    file:'scripts/browser_action.js',
    runAt:'document_idle'
  });
  var creating = browser.tabs.create({
    url: browser.extension.getURL("pages/smartwrap.html")
  })
  creating.then(onCreated,onError);
  browser.runtime.onMessage.addListener(handleMessage);

});
