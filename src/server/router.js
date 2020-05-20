const Vue = require('vue');
const utils = require('./utils');
const {createRenderer} = require('vue-server-renderer');
const renderer = createRenderer({
    template: utils.getFile('./view/index.template.html')
});

function createApp(options) {
    return new Vue(options);
}

function index(req, res, context) {
    let app = createApp({
        template: utils.getFile('./view/index.html')
    });
    context.js = '<script src="/js/index.js" type="text/javascript"></script>'
    renderer.renderToString(app, context, (err, html) => {
        res.end(html);
    });
}

function search(req, res, options) {
    let defs = {
        template: utils.getFile('./view/search.html'),
        data: Object.assign({
            pageList: [],
            path: `/search?key=${req.query.key}`,
            last: Math.ceil(options.data.total / 20),
            pager: {
                prev: '',
                next: '',
                first: '',
                last: ''
            }
        }, options.data),
        created() {
            let key = this.value.split(' ').filter(d => d.length).join('|');
            this.reg = new RegExp(`(${key})`, 'gi');
            this.genPage();
        },
        methods: {
            genPage() {
                this.pager.prev = this.page === 1 ? `<` : `<a href="${this.path}&page=${this.page-1}">&lt;</a>`;
                this.pager.first = this.page === 1 ? 1 : `<a href="${this.path}&page=1">1</a>`;
                this.pager.last = this.page === this.last ? this.last : `<a href="${this.path}&page=${this.last}">${this.last}</a>`;
                this.pager.next = this.page === this.last ? `>` : `<a href="${this.path}&page=${this.page+1}">&gt;</a>`;
                let start, end, page;
                if(this.last < 7) {
                    start = 2;
                    end = this.last - 1;
                } else {
                    if(this.page < 5) {
                        start = 2;
                        end = 6;
                    } else if(this.page > this.last - 5) {
                        start = this.last - 6;
                        end = this.last - 1;
                    } else {
                        start = this.page - 3 > 1 ? this.page - 2 : 2;
                        end = this.page + 3 < this.last ? this.page + 2 : this.last - 1;
                    }
                }
                if(this.page > 4) {
                    page = this.page - 7 > 0 ? this.page - 7 : 1;
                    if(start === 2) start++;
                    this.pageList.push({
                        content: `<a href="${this.path}&page=${page}">...</a>`
                    })
                }
                while(start <= end) {
                    this.pageList.push({
                        page: start,
                        content: this.page === start ? start : `<a href="${this.path}&page=${start}">${start}</a>`
                    });
                    start++;
                }
                if(this.page < this.last - 4) {
                    page = this.page + 7 < this.last ? this.page + 7 : this.last;
                    if(end === this.last - 2) this.pageList.pop();
                    this.pageList.push({
                        content: `<a href="${this.path}&page=${page}">...</a>`
                    })
                }
            },
            formatTime(k) {
                return utils.formatTime(k)
            },
            filterKeyword(k) {
                return k.replace(this.reg, '<span>$1</span>')
            }
        }
    };
    if(defs.data.page > defs.data.last && defs.data.page !== 1) return res.redirect(defs.data.path + '&page=' + defs.data.last);
    if(defs.data.page < 1) return res.redirect(defs.data.path);
    let context = {};
    context.title = options.title;
    let app = createApp(defs);
    context.js = '<script src="/js/index.js" type="text/javascript"></script>'
    renderer.renderToString(app, context, (err, html) => {
        res.end(html);
    });
}

function detail(req, res, options) {
    let defs = {
        template: utils.getFile('./view/detail.html'),
        data: options.data,
        created() {
            if(this.filelist) {
                let c = this.filelist.split('|');
                let o = {};
                this.filelist = [];
                for(let i = 0, l = c.length; i < l; i += 2) {
                    this.filelist.push({
                        name: c[i],
                        size: c[i + 1]
                    })
                }
            }
        },
        computed: {
            magnet() {
                return 'magnet:?xt=urn:btih:' + this.id.toUpperCase()
            }
        }
    };
    let app = createApp(defs);
    renderer.renderToString(app, {title: options.title, js: ''}, (err, html) => {
        res.end(html);
    });
}


module.exports = {
    search,
    index,
    detail
};