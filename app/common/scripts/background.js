/**
 * Created by Xiao Liang Yu <me@hiubright.com>
 */
import browser from "webextension-polyfill";
const context = typeof browser === 'undefined' ? chrome : browser;
var swTab;
var csTab;
var DocMessage;
function onCreated(windowInfo) {
  // console.log("in here");
  swTab = windowInfo;
  // console.log(DocMessage);
  // browser.tabs.sendMessage(swTab.id,DocMessage);
}
function onError(error) {
  console.log(error);
}
function handleMessage(message,sender,sendResponse) {
  // console.log(message);
  if (message.eventName) {
    // console.log(message.eventName);
    // console.log(swTab);
    // console.log(csTab);
    if (message.eventName == "dragstart_msg") {
      // console.log(swTab.id);
      browser.tabs.sendMessage(swTab.id,message);
    }
    if (message.eventName == "docMsg") {
      // console.log("in docMsg");
      // console.log(swTab.id);
      DocMessage = message;
      browser.tabs.sendMessage(swTab.id,message);

    }

    if (message.eventName == "contentTab") {
      // console.log("sender");
      // console.log(sender);
      csTab = sender.tab;
    }
    if (message.eventName == "pageReady") {
      // console.log(csTab.id);
      browser.tabs.sendMessage(csTab.id,message);
    }
  }


}
browser.browserAction.onClicked.addListener(()=>{
  browser.tabs.executeScript({
    file:'scripts/browser_action.js',
    runAt:'document_idle'
  });
  var creating = browser.windows.create({
    url: browser.runtime.getURL("pages/smartwrap.html")
  })
  creating.then(onCreated,onError);

  browser.runtime.onMessage.addListener(handleMessage);

});
