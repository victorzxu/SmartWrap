/**
 * Created by Xiao Liang Yu <me@hiubright.com>
 */

const context = typeof browser === 'undefined' ? chrome : browser;

context.browserAction.onClicked.addListener(()=>{
  context.tabs.executeScript({
    file:'scripts/sidebar.js'
  });
});
