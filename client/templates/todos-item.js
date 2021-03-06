var EDITING_KEY = 'EDITING_TODO_ID';

var ToastNotification = function (thisId, thisText, ifPi) {

  console.log("sending toast: " + ifPi);

  if(typeof Windows !== 'undefined' && 
       typeof Windows.UI !== 'undefined' && 
       typeof Windows.UI.Notifications !== 'undefined' &&
       ifPi === false) {

        var notifications = Windows.UI.Notifications,
            templateType = notifications.ToastTemplateType.toastImageAndText02,
            templateContent = notifications.ToastNotificationManager.getTemplateContent(templateType),
            toastMessage = templateContent.getElementsByTagName('text'),
            toastImage = templateContent.getElementsByTagName('image'),
            toastElement = templateContent.selectSingleNode('/toast');

        console.log(thisId);

        var launchParams = {
            type: 'toast',
            id: thisId || 'demoToast',
            heading: thisText || 'Demo title',
            body: thisText || 'Demo message'
        };

        var launchString = JSON.stringify(launchParams);

        var imgUrl, imgAlt;
        imgUrl = "https://raw.githubusercontent.com/seksenov/WindowsToDos/master/public/img/ToastLogo.png";
        imgAlt = 'https://unsplash.it/150/?random';
      
        // Set message & image in toast template
        toastMessage[0].appendChild(templateContent.createTextNode(thisText || 'Demo message'));
        toastImage[0].setAttribute('src', imgUrl || 'https://unsplash.it/150/?random');
        toastImage[0].setAttribute('alt', imgAlt || 'Random sample image');
        toastElement.setAttribute('duration', 'long');
        toastElement.setAttribute('launch', launchString); // Optional Launch Parameter

        // Add actions
        var actions = templateContent.createElement('actions');
        templateContent.firstChild.appendChild(actions);

        // Create a yes button
        var btnYes = templateContent.createElement('action');
        btnYes.setAttribute('content', 'Got It');
        btnYes.setAttribute('arguments', thisId);
        btnYes.setAttribute('launchType', 'foreground');
        actions.appendChild(btnYes);

        //Create a no button
        var btnNo = templateContent.createElement('action');
        btnNo.setAttribute('content', 'Nope');
        btnNo.setAttribute('arguments', 'no');
        btnNo.setAttribute('launchType', 'foreground');
        actions.appendChild(btnNo);

        // Show the toast
        var toast = new notifications.ToastNotification(templateContent);
        var toastNotifier = new notifications.ToastNotificationManager.createToastNotifier();
        toast.tag = "demoToast";
        console.log(toast);        
        toastNotifier.show(toast);
      }
      else {
        console.log("yolo");
        var text = thisText || 'Demo message';
        Toast.info(text);
      }

}

Template.todosItem.helpers({
  checkedClass: function() {
    return this.checked && 'checked';
  },
  editingClass: function() {
    return Session.equals(EDITING_KEY, this._id) && 'editing';
  }
  
});


Template.todosItem.events({
  'change [type=checkbox]': function(event) {
    var checked = $(event.target).is(':checked');
    Todos.update(this._id, {$set: {checked: checked}});
    Lists.update(this.listId, {$inc: {incompleteCount: checked ? -1 : 1}});
  },
  
  'focus input[type=text]': function(event) {
    Session.set(EDITING_KEY, this._id);
  },
  
  'blur input[type=text]': function(event) {
    if (Session.equals(EDITING_KEY, this._id))
      Session.set(EDITING_KEY, null);
  },
  
  'keydown input[type=text]': function(event) {
    // ESC or ENTER
    if (event.which === 27 || event.which === 13) {
      event.preventDefault();
      event.target.blur();
    }
  },
  
  // update the text of the item on keypress but throttle the event to ensure
  // we don't flood the server with updates (handles the event at most once 
  // every 300ms)
  'keyup input[type=text]': _.throttle(function(event) {
    Todos.update(this._id, {$set: {text: event.target.value}});
  }, 300),

  
  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-delete-item, click .js-delete-item': function() {
    Todos.remove(this._id);
    if (! this.checked)
      Lists.update(this.listId, {$inc: {incompleteCount: -1}});
  }
});

Template.todosItem.rendered = function(){
  // ToDo Items are updated
  if(!this.rendered) {
    this.rendered = true;
    // Only call the notification on new tasks that are created
    if (Date.parse(this.data.createdAt) >= Session.get("LoadedTime")) {
      // Call notification to pop up toast
      var piImg = document.createElement("img");
      var ifPi = true;

      console.log("XHR to find the img");

      var http = new XMLHttpRequest();
      http.open('GET', "ms-appx-web:///images/RaspberryPi.png");
      http.send();
      http.thisId = this.data._id;
      http.thisText = this.data.text;
      http.onreadystatechange=function() {
        if (http.readyState==4 && http.status === 500) {
          console.log("Calling notification with false");
          ToastNotification(this.thisId, this.thisText, false);
        }
        else if (http.readyState==4 && http.status != 500) {
          console.log("Calling notification with true");
          ToastNotification(this.thisId, this.thisText, true);
        }
      }
    }
  }    
}