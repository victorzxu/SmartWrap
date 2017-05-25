//Placeholder for future codes
//Used to save the changes of the perference, and deal with the changes
  localStorage.debug = true;
  import bow from 'bows';
  import $ from 'jquery';
  import ChromePromise from 'chrome-promise';
  browser = new ChromePromise();
  import 'chrome-browser-object-polyfill';
   async function initOptions (evt)  {
    const log = bow('initOptions');
    const defaultOptions = {
      'pref_permicon': true,
      'pref_animateselector': true,
      'pref_maxchars': 400,
      'pref_buttonstyle': "both",
      algorithm: "AUTO",
      dragSelector: "HOVER",
      dragIndicator : "BLUEBOX"
    }
    await browser.storage.local.set(defaultOptions);
    await restoreOptions();
    evt.preventDefault();
    return false;
  }


  function saveOptions() {
    let newOptions = {
      pref_permicon : $('#show_icon_in_toolbar')[0].checked,
      pref_animateselector :  $('#animate_selector_movement')[0].checked,
      pref_maxchars : $('#max_char_in_cells').val(),
      pref_buttonstyle : $('#button_style').val(),
      algorithm : $('#algorithm').val(),
      dragSelector : $('#drag_selection_mode').val(),
      dragIndicator : $('#drag_indication_mode').val(),
  };
    browser.storage.local.set(newOptions);
  }
  async function restoreOptions()  {
    removeChangeListeners();
    const log = bow('restoreOptions');
    $('#show_icon_in_toolbar').prop ("checked",Object.values(await browser.storage.local.get('pref_permicon'))[0]);

    $('#animate_selector_movement').prop ("checked",Object.values(await browser.storage.local.get('pref_animateselector'))[0]);
    $('#max_char_in_cells').val(Object.values(await browser.storage.local.get('pref_maxchars'))[0]);
    $('#button_style').val(Object.values( await browser.storage.local.get('pref_buttonstyle'))[0]);
    $('#algorithm').val(Object.values(await browser.storage.local.get('algorithm'))[0]);
    $('#drag_selection_mode').val(Object.values(await browser.storage.local.get('dragSelector'))[0]);
    $('#drag_indication_mode').val(Object.values(await browser.storage.local.get('dragIndicator'))[0]);
    createChangeListeners();
  }
  async function onReady() {
    await restoreOptions();
    const log = bow('onReady');
    log("before click");
    log(document.querySelector('#default'));
    /*ZD: querySelector doesn't work somehow. Why?
      Tell us if you find out.
     */
    // document.querySelector('#default').addEventListener("click",initOptions);
    $("#default").click(initOptions);
  }
  function createChangeListeners() {

    document.querySelectorAll(".pref").forEach((x)=>{x.addEventListener("change",saveOptions);});
  }
  function removeChangeListeners() {
     const log = bow('removeChangeListeners');
      document.querySelectorAll(".pref").forEach((x)=>{x.removeEventListener("change",saveOptions);});
  }




  document.addEventListener("DOMContentLoaded", onReady);
