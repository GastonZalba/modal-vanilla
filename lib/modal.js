/**
 * Vanilla JS Modal compatible with Bootstrap
 * modal-vanilla 0.2.7 <https://github.com/KaneCohen/modal-vanilla>
 * Copyright 2016 Kane Cohen <https://github.com/KaneCohen>
 * Available under BSD-3-Clause license
 */
import EventEmitter from 'events';

const _factory = document.createElement('div');

const _scrollbarWidth = calcScrollbarWidth();

const _defaults = Object.freeze({
  el: null,             // Existing DOM element that will be 'Modal-ized'.
  animate: true,        // Show Modal using animation.
  appendTo: 'body',     // DOM element to which constructed Modal will be appended.
  backdrop: true,       // Boolean or 'static', Show Modal backdrop bocking content.
  keyboard: true,       // Close modal on esc key.
  title: false,         // Content of the title in the constructed dialog.
  header: true,         // Show header content.
  content: false,       // Either string or an HTML element.
  footer: true,         // Footer content. By default will use buttons.
  buttons: null,
  headerClose: true,    // Show close button in the header.
  construct: false,     // Creates new HTML with a given content.
  transition: 300,
  backdropTransition: 150
});

const _buttons = deepFreeze({
  dialog: [
    {text: 'Cancel',
      value: false,
      attr: {
        'class': 'btn btn-flat btn-danger',
        'data-dismiss': 'modal'
      }
    },
    {text: 'OK',
      value: true,
      attr: {
        'class': 'btn btn-primary',
        'data-dismiss': 'modal'
      }
    }
  ],
  alert: [
    {text: 'OK',
      attr: {
        'class': 'btn btn-primary',
        'data-dismiss': 'modal'
      }
    }
  ],
  confirm: [
    {text: 'Cancel',
      value: false,
      attr: {
        'class': 'btn btn-danger',
        'data-dismiss': 'modal'
      }
    },
    {text: 'OK',
      value: true,
      attr: {
        'class': 'btn btn-primary',
        'data-dismiss': 'modal'
      }
    }
  ]
});

function deepFreeze(obj) {
  for (let k in obj) {
    if (Array.isArray(obj[k])) {
      obj[k].forEach(v => {
        deepFreeze(v);
      });
    } else if (obj[k] !== null && typeof obj[k] === 'object') {
      Object.freeze(obj[k]);
    }
  }
  return Object.freeze(obj);
}

function guid() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16) +
    (((1 + Math.random()) * 0x10000) | 0).toString(16);
}

function data(el, prop, value) {
 let prefix = 'data';
 let elData = el[prefix] || {};
 if (typeof value === 'undefined') {
   if (el[prefix] && el[prefix][prop]) {
     return el[prefix][prop];
   } else {
     var dataAttr = el.getAttribute(`${prefix}-${prop}`);
     if (typeof dataAttr !== 'undefined') {
       return dataAttr;
     }
     return null;
   }
 } else {
   elData[prop] = value;
   el[prefix] = elData;
   return el;
 }
}

function build(html, all) {
  if (html.nodeName) return html;
  html = html.replace(/(\t|\n$)/g, '');

  _factory.innerHTML = '';
  _factory.innerHTML = html;
  if (all === true) {
    return _factory.childNodes;
  } else {
    return _factory.childNodes[0];
  }
}

function calcScrollbarWidth() {
  let inner;
  let width;
  let outerWidth;
  let outer = document.createElement('div');
  Object.assign(outer.style, {
    visibility: 'hidden',
    width: '100px'
  });
  document.body.appendChild(outer);

  outerWidth = outer.offsetWidth;
  outer.style.overflow = 'scroll';

  inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  width = outerWidth - inner.offsetWidth;
  document.body.removeChild(outer);

  return width;
}

class Modal extends EventEmitter {

  static get version() {
    return '0.2.6';
  }

  static alert(message, _options = {}) {
    let options = Object.assign({},
      _defaults,
      {
        title:  message,
        content: false,
        construct: true,
        buttons: _buttons.alert
      },
      _options
    );

    return new Modal(options);
  }

  static confirm(question, _options = {}) {
    let options = Object.assign({},
      _defaults,
      {
        title:  question,
        content: false,
        construct: true,
        buttons: _buttons.confirm
      },
      _options
    );

    return new Modal(options);
  }

  get _buttons() {
    return _buttons;
  }

  get _templates() {
    return {
      container: '<div class="modal"></div>',
      dialog: '<div class="modal-dialog"></div>',
      content: '<div class="modal-content"></div>',
      header: '<div class="modal-header"></div>',
      body: '<div class="modal-body"></div>',
      footer: '<div class="modal-footer"></div>',
      backdrop: '<div class="modal-backdrop"></div>'
    };
  }

  constructor(options = {}) {
    super();

    this.id = guid();
    this.el = null;
    this._html = {};
    this._handlers = {};
    this._visible = false;
    this._options = Object.assign({}, _defaults, options);
    this._html.appendTo = document.querySelector(this._options.appendTo);

    if (this._options.buttons === null) {
      this._options.buttons = this._buttons.dialog;
    }

    if (this._options.el) {
      let el = this._options.el;
      if (typeof this._options.el == 'string') {
        el = document.querySelector(this._options.el);
        if (! el) {
          throw new Error(`Selector: DOM Element ${this._options.el} not found.`);
        }
      }
      data(el, 'modal', this);
      this.el = el;
    } else {
      this._options.construct = true;
    }

    if (this._options.construct) {
      this._render();
    } else {
      this._mapDom();
    }
  }

  _render() {
    let html = this._html;
    let o = this._options;
    let t = this._templates;
    let animate = o.animate ? 'fade' : '';

    html.container = build(t.container);
    html.dialog = build(t.dialog);
    html.content = build(t.content);
    html.header = build(t.header);
    html.body = build(t.body);
    html.footer = build(t.footer);
    html.container.classList.add(animate);

    this._setHeader();
    this._setContent();
    this._setFooter();

    this.el = html.container;

    html.dialog.appendChild(html.content);
    html.container.appendChild(html.dialog);

    return this;
  }

  _mapDom() {
    let html = this._html;
    let o = this._options;

    if (this.el.classList.contains('fade')) {
      o.animate = true;
    }

    html.container = this.el;
    html.dialog = this.el.querySelector('.modal-dialog');
    html.content = this.el.querySelector('.modal-content');
    html.header = this.el.querySelector('.modal-header');
    html.body = this.el.querySelector('.modal-body');
    html.footer = this.el.querySelector('.modal-footer');

    this._setHeader();
    this._setContent();
    this._setFooter();

    return this;
  }

  _setHeader() {
    let html = this._html;
    let o = this._options;

    if ((o.header && ! html.header.nodeName) || o.title) {
      if (o.title.nodeName) {
        html.header.innerHTML = o.title.outerHTML;
      } else if (typeof o.title === 'string') {
        html.header.innerHTML = `<h4 class="modal-title">${o.title}</h4>`;
      }
      html.content.appendChild(html.header);
    }
  }

  _setContent() {
    let html = this._html;
    let o = this._options;

    if (o.content) {
      if (typeof o.content === 'string') {
        html.body.innerHTML = o.content;
      } else {
        html.body.innerHTML = o.content.outerHTML;
      }
      html.content.appendChild(html.body);
    }
  }

  _setFooter() {
    let html = this._html;
    let o = this._options;

    if (o.footer) {
      html.footer.innerHTML = '';
      if (o.footer.nodeName) {
        html.footer.ineerHTML = o.footer.outerHTML;
      } else if (typeof o.footer === 'string') {
        html.footer.innerHTML = o.footer;
      } else {
        o.buttons.forEach((button) => {
          let el = document.createElement('button');
          data(el, 'button', button);
          el.innerHTML = button.text;
          for (let j of Object.keys(button.attr)) {
            el.setAttribute(j, button.attr[j]);
          }
          html.footer.appendChild(el);
        });
      }
      html.content.appendChild(html.footer);
    }

  }

  _setEvents() {
    let o = this._options;
    let html = this._html;

    if (o.backdrop === true) {
      this._handlers.keydownHandler = (e) => this._handleKeydownEvent(e);
      document.body.addEventListener('keydown',
        this._handlers.keydownHandler
      );
    }

    this._handlers.clickHandler = (e) => this._handleClickEvent(e);
    html.container.addEventListener('click',
      this._handlers.clickHandler
    );

    this._handlers.resizeHandler = (e) => this._handleResizeEvent(e);
    window.addEventListener('resize',
      this._handlers.resizeHandler
    );
  }

  _handleClickEvent(e) {
    let html = this._html;
    if (e.target.getAttribute('data-dismiss') === 'modal') {
      this.emit('dismiss', this, e, data(e.target, 'button'));
      this.hide();
      return true;
    }
    if (e.target !== html.container) {
      return true;
    }
    this.hide();
  }

  _handleKeydownEvent(e) {
    if (e.which === 27) {
      this.emit('dismiss', this, e, null);
      this.hide();
    }
  }

  _handleResizeEvent(e) {
    this._resize();
  }

  show() {
    let o = this._options;
    let html = this._html;
    this.emit('beforeShow', this);

    this._checkScrollbar();
    this._setScrollbar();
    document.body.classList.add('modal-open');

    if (o.construct) {
      html.appendTo.appendChild(html.container);
    }

    html.container.style.display = 'block';
    html.container.scrollTop = 0;

    this.once('showBackdrop', () => {
      this._setEvents();

      if (o.animate) html.container.offsetWidth; // Force reflow

      html.container.classList.add('in');

      setTimeout(() => {
        this._visible = true;
        this.emit('show', this);
      }, o.transition);
    });

    this._backdrop();
    this._resize();

    return this;
  }

  _resize() {
    var modalIsOverflowing =
      this._html.container.scrollHeight > document.documentElement.clientHeight;

    this._html.container.style.paddingLeft =
      ! this.bodyIsOverflowing && modalIsOverflowing ? _scrollbarWidth + 'px' : '';

    this._html.container.style.paddingRight =
      this.bodyIsOverflowing && ! modalIsOverflowing ? _scrollbarWidth + 'px' : '';
  }

  _backdrop() {
    let html = this._html;
    let t = this._templates;
    let animate = this._options.animate ? 'fade' : '';

    html.backdrop = build(t.backdrop);
    html.backdrop.classList.add(animate);
    html.appendTo.appendChild(html.backdrop);

    if (animate) html.backdrop.offsetWidth;

    html.backdrop.classList.add('in');

    setTimeout(() => {
      this.emit('showBackdrop', this);
    }, this._options.backdropTransition);
  }

  hide() {
    let html = this._html;
    let backCList = html.backdrop.classList;
    let contCList = html.container.classList;
    this.emit('beforeHide', this);

    backCList.remove('in');
    contCList.remove('in');

    this._removeEvents();

    setTimeout(() => {
      document.body.classList.remove('modal-open');
      document.body.style.paddingRight = this.originalBodyPad;
      html.backdrop.remove();
      html.container.style.display = 'none';
      if (this._options.construct) {
        html.container.remove();
      }
      this._visible = false;
      this.emit('hide', this);
    }, this._options.transition);

    return this;
  }

  _removeEvents() {
    if (this._handlers.keydownHandler) {
      document.body.removeEventListener('keydown',
        this._handlers.keydownHandler
      );
    }

    this._html.container.removeEventListener('click',
      this._handlers.clickHandler
    );

    window.removeEventListener('resize',
      this._handlers.resizeHandler
    );
  }

  _checkScrollbar() {
    this.bodyIsOverflowing = document.body.clientWidth < window.innerWidth;
  }

  _setScrollbar() {
    this.originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) {
      let basePadding = parseInt(this.originalBodyPad || 0, 10);
      document.body.style.paddingRight = basePadding + _scrollbarWidth + 'px';
    }
  }
}

export default Modal;