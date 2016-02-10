var MENU_KEY = 'menuOpen';
Session.setDefault(MENU_KEY, false);

var USER_MENU_KEY = 'userMenuOpen';
Session.setDefault(USER_MENU_KEY, false);

var SHOW_CONNECTION_ISSUE_KEY = 'showConnectionIssue';
Session.setDefault(SHOW_CONNECTION_ISSUE_KEY, false);

var CONNECTION_ISSUE_TIMEOUT = 5000;

Meteor.startup(function () {
  // Attach Windows Activated Event Handler
  if(Meteor.isClient) {
    Session.set("AppLoaded", false);
    Session.set("LoadedTime", Date.now());
    var resposne = "no";
    // Check for Windows Activation Events
    if (typeof Windows !== 'undefined') {
      Windows.UI.WebUI.WebUIApplication.addEventListener("activated", function (args) {
        //console.log("Windows application is activated");
        // This is where handling the notification goes
        var activation = Windows.ApplicationModel.Activation;

        // Handle applcation launch from the Windows OS
        if (args.kind === activation.ActivationKind.launch) {
            // Check if there are launch args
            console.log("This is a LAUNCH activation");
        }
        // Handle user interaction from toast notification on Windows
        else if (args.kind === activation.ActivationKind.toastNotification) {                
              //toastHandler(args.argument, args.userInput.textReply);
              console.log("This ia a TOAST activation");
              //Session.set("Response", args.argument);
              //console.log("Seesion at TOAST: " + Session.get("Response"));
              if (args.argument !== "no") {
                Todos.update(args.argument, {$set: {checked: true}});
                console.log(args.argument);
              };
        }
      });
    } 
  }

  // set up a swipe left / right handler
  $(document.body).touchwipe({
    wipeLeft: function () {
      Session.set(MENU_KEY, false);
    },
    wipeRight: function () {
      Session.set(MENU_KEY, true);
    },
    preventDefaultEvents: false
  });

  // Only show the connection error box if it has been 5 seconds since
  // the app started
  setTimeout(function () {
    // Launch screen handle created in lib/router.js
    dataReadyHold.release();

    // Show the connection error box
    Session.set(SHOW_CONNECTION_ISSUE_KEY, true);
  }, CONNECTION_ISSUE_TIMEOUT);
});

Template.appBody.onRendered(function() {
  this.find('#content-container')._uihooks = {
    insertElement: function(node, next) {
      $(node)
        .hide()
        .insertBefore(next)
        .fadeIn(function () {
          if (listFadeInHold) {
            listFadeInHold.release();
          }
        });
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        $(this).remove();
      });
    }
  };
});

Template.appBody.helpers({
  // We use #each on an array of one item so that the "list" template is
  // removed and a new copy is added when changing lists, which is
  // important for animation purposes. #each looks at the _id property of it's
  // items to know when to insert a new item and when to update an old one.
  thisArray: function() {
    return [this];
  },
  menuOpen: function() {
    return Session.get(MENU_KEY) && 'menu-open';
  },
  cordova: function() {
    return Meteor.isCordova && 'cordova';
  },
  emailLocalPart: function() {
    var email = Meteor.user().emails[0].address;
    return email.substring(0, email.indexOf('@'));
  },
  userMenuOpen: function() {
    return Session.get(USER_MENU_KEY);
  },
  lists: function() {
    return Lists.find();
  },
  activeListClass: function() {
    var current = Router.current();
    if (current.route.name === 'listsShow' && current.params._id === this._id) {
      return 'active';
    }
  },
  connected: function() {
    if (Session.get(SHOW_CONNECTION_ISSUE_KEY)) {
      return Meteor.status().connected;
    } else {
      return true;
    }
  }
});

Template.appBody.events({
  'click .js-menu': function() {
    Session.set(MENU_KEY, ! Session.get(MENU_KEY));
  },

  'click #web-on-pi-home': function() {
    window.location.href = "webonpi:home";
  },

  'click .content-overlay': function(event) {
    Session.set(MENU_KEY, false);
    event.preventDefault();
  },

  'click .js-user-menu': function(event) {
    Session.set(USER_MENU_KEY, ! Session.get(USER_MENU_KEY));
    // stop the menu from closing
    event.stopImmediatePropagation();
  },

  'click #menu a': function() {
    Session.set(MENU_KEY, false);
  },

  'click .js-logout': function() {
    Meteor.logout();

    // if we are on a private list, we'll need to go to a public one
    var current = Router.current();
    if (current.route.name === 'listsShow' && current.data().userId) {
      Router.go('listsShow', Lists.findOne({userId: {$exists: false}}));
    }
  },

  'click .js-new-list': function() {
    var list = {name: Lists.defaultName(), incompleteCount: 0};
    list._id = Lists.insert(list);

    Router.go('listsShow', list);
  }
});

Template.appBody.rendered = function() {
  if(!this.rendered) {
    this.rendered = true;
    // Detect if the Windows namespace exists in the global object
    if (typeof Windows !== 'undefined' &&
      typeof Windows.UI !== 'undefined' &&
      typeof Windows.UI.ViewManagement !== 'undefined') {
      var brandColor = {r: 50, g: 84, b: 129, a:255}
      var brandColorInactive = {r: 209, g: 237, b: 245, a:255}
        // Get a reference to the App Title Bar
        var appTitleBar = Windows.UI.ViewManagement.ApplicationView.getForCurrentView().titleBar;
        
        var black = {r: 0, g: 0, b: 0, a:255};
        var white = {r: 255, g: 255, b: 255, a:255};

        appTitleBar.foregroundColor = white;
        appTitleBar.backgroundColor = brandColor;

        appTitleBar.buttonForegroundColor = white;
        appTitleBar.buttonBackgroundColor = brandColor;

        appTitleBar.buttonHoverForegroundColor = white;
        appTitleBar.buttonHoverBackgroundColor = brandColor;

        appTitleBar.buttonPressedForegroundColor = brandColor;
        appTitleBar.buttonPressedBackgroundColor = white;

        appTitleBar.inactiveBackgroundColor = brandColorInactive;
        appTitleBar.inactiveForegroundColor = brandColor;

        appTitleBar.buttonInactiveForegroundColor = brandColor;
        appTitleBar.buttonInactiveBackgroundColor = brandColorInactive;

        appTitleBar.buttonInactiveHoverForegroundColor = brandColor;
        appTitleBar.buttonInactiveHoverBackgroundColor = brandColorInactive;

        appTitleBar.buttonPressedForegroundColor = brandColor;
        appTitleBar.buttonPressedBackgroundColor = brandColorInactive;
      }
  }
}
