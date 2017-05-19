/**
 * Created by Xiao Liang Yu <me@hiubright.com>
 */

browser.browserAction.onClicked.addListener(()=>{
  browser.tabs.executeScript({
    file:'scripts/sidebar.js'
  });
});
