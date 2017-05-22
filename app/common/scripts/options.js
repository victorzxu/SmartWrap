//Placeholder for future codes
//Used to save the changes of the perference, and deal with the changes
  function initOptions = function () {
    defaultOptions = {
      'pref_permicon': false,
      'pref_animateselector': true,
      'pref_maxchars': 400,
      'pref_buttonstyle': "both",
      'pref_algorithm': "AUTO",
      'pref_dragselect': "HOVER",
      'pref_dragindic' : "BLUEBOX"
    }
    Object.keys(defaultOptions).forEach(function (key) {
      brower.storage.local.setItem(key,defaultOptions[key]);
    });
  }
  function saveOptions = function () {
    newOptions = {};
    newOptions['pref_permicon'] = document.querySelector('#show_icon_in_toolbar');
    newOptions['pref_animateselector'] = document.querySelector('#animate_selector_movement');
    newOptions['pref_maxchars'] = document.querySelector('#max_char_in_cell');
    newOptions['pref_buttonstyle'] = document.querySelector('#button_style');
    newOptions['pref_algorithm'] = document.querySelector('#algorithm');
    newOptions['pref_dragselect'] = document.querySelector('#drag_selection_mode');
    newOptions['pref_dragindic'] = document.querySelector('#drag_indication_mode');
    Object.keys(defaultOptions).forEach(function (key) {
      brower.storage.local.setItem(key,newOptions[key]);
    });
  }
  function restoreOptions() {
    document.querySelector('#show_icon_in_toolbar').value = browers.storage.local.get('pref_permicon');
    document.querySelector('#animate_selector_movement').value = browers.storage.local.get('pref_animateselector');
    document.querySelector('#max_char_in_cell').value = browers.storage.local.get('pref_maxchars');
    document.querySelector('#button_style').value = browers.storage.local.get('pref_buttonstyle');
    document.querySelector('#algorithm').value = browers.storage.local.get('pref_algorithm');
    document.querySelector('#drag_selection_mode').value = browers.storage.local.get('pref_dragselect');
    document.querySelector('#drag_indication_mode').value = browers.storage.local.get('pref_dragindic');
  }
  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("form").addEventListener("submit", saveOptions);
