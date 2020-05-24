const express = require('express');
const app = express();
const port = 5557;
const path = require('path');
const query = require('./sql');
const router = require('./router');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    router.index(req, res, {
        title: 'Bt Search'
    });
});

app.get('/search', (req, res) => {
    if(req.query.key) {
        req.query.key = decodeURIComponent(req.query.key);
        let key = req.query.key.split(' ').filter(d => d.length).map(d => `name like '%${d}%'`).join(' or ');
        let page = isNaN(req.query.page) ? 1 : (Number(req.query.page) || 1);
        let size = 20;
        let start = (page - 1) * size;
        let sql = `select sql_calc_found_rows * from m_hash where ${key} order by create_time desc limit ${start},${size}`;
        let options = {data: {}};
        query(sql, (err, results) => {
            if(err) return res.redirect('/');
            options.data.list = results;
            query(`select found_rows() total`, (err, results) => {
               if(err) return res.redirect('/');
               if(!results[0].total && page > 1) return res.redirect(`/search?key=${req.query.key}`);
               options.data.total = results[0].total;
               options.data.page = page;
               options.data.value = req.query.key;
               options.title = req.query.key + ' - Bt Search';
               router.search(req, res, options);
            });
        });
    } else {
        res.redirect('/');
    }
});

app.get('/latest', (req, res) => {
   let sql = `select * from m_hash order by create_time desc limit 0, 100`;
   query(sql, (err, results) => {
       if(err) return res.redirect('/');
       router.latest(req, res, {title: '最新100 - Bt Search', data: {list: results}});
   })
});

app.get('/detail.html', (req, res) => {
    if(!req.query.hash) return res.redirect('/');
    let sql = `select *, (select group_concat(name,'|',size separator '|') from m_file where \`hash\`='${req.query.hash}' group by \`hash\`) filelist from m_hash where id='${req.query.hash}'`;
    query(sql, (err, results) => {
        if(err || !results[0]) return res.redirect('/');
       let optios = {
           data: Object.assign({}, results[0]),
           title: results[0].name + ' - Bt Search'
       };
       router.detail(req, res, optios);
    });
});

app.get('*', (req, res) => {
   res.redirect('/');
});

app.listen(port);