var EDITING_KEY = 'EDITING_TODO_ID';

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
      console.log("calling notification")
      if(typeof Windows !== 'undefined' && 
       typeof Windows.UI !== 'undefined' && 
       typeof Windows.UI.Notifications !== 'undefined') {

        var notifications = Windows.UI.Notifications;
        //Get the XML template where the notification content will be suplied
        var template = notifications.ToastTemplateType.toastImageAndText01;
        var toastXml = notifications.ToastNotificationManager.getTemplateContent(template);
        //Supply the text to the XML content
        var toastTextElements = toastXml.getElementsByTagName("text");
        toastTextElements[0].appendChild(toastXml.createTextNode(message));
        //Supply an image for the notification
        var toastImageElements = toastXml.getElementsByTagName("image");
        //Set the image this could be the background of the note, get the image from the web
        toastImageElements[0].setAttribute("src", "https://raw.githubusercontent.com/seksenov/grouppost/master/images/logo.png");
        toastImageElements[0].setAttribute("alt", "red graphic");
        //Specify a long duration
        var toastNode = toastXml.selectSingleNode("/toast");
        toastNode.setAttribute("duration", "long");
        //Specify the audio for the toast notification
        var toastNode = toastXml.selectSingleNode("/toast");                        
        var audio = toastXml.createElement("audio");
        audio.setAttribute("src", "ms-winsoundevent:Notification.IM");
        //Specify launch paramater
        toastXml.selectSingleNode("/toast").setAttribute("launch", '{"type":"toast","param1":"12345","param2":"67890"}');
        //Create a toast notification based on the specified XML
        var toast = new notifications.ToastNotification(toastXml);
        //Send the toast notification
        var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
        toastNotifier.show(toast);
      }
    }
  }    
}