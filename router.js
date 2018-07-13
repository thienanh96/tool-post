var express = require('express');
var router = express.Router();
const request = require('request');
var Crawler = require("crawler");
const rp = require('request-promise');
const delay = require('delay');
var POSTS = require('./posts');
var unique = require('array-unique');
const numberPosts = 24;

// Queue just one URL, with default callback
var searchThemoviedb = async (realName, tenphim, motaphim) => {
    let options1 = {
        uri: 'https://api.themoviedb.org/3/search/movie',
        qs: {
            api_key: '06113359d280370f1d9375730b686c63',
            query: realName
        },
        json: true
    }
    let json1 = await rp(options1);
    let idFilm;
    if (json1.total_results !== 0) {
        idFilm = json1.results[0].id;
    } else {
        idFilm = 0;
    }
    return idFilm
}

var getThemoviedb = async (idFilm) => {
    let options2 = {
        uri: 'https://api.themoviedb.org/3/movie/' + idFilm,
        qs: {
            api_key: '06113359d280370f1d9375730b686c63',
            language: 'vi'
        }
    }
    let json2;
    if (idFilm !== 0) {
        json2 = await rp(options2);
    } else {
        json2 = 0;
    }
    return json2;
}

var xuLyDienVien = (dvs) => {
    let dvsArr = dvs.split(',');
    let output1 = [];
    let output2 = [];
    for (let dv of dvsArr) {
        let orgDv = dv.trim();
        dv = dv.toLowerCase()
        dv = dv.trim();
        dv = 'pp_' + dv.replace(/ /g, '-');
        let newDv = dv + '_' + orgDv;
        newDv = ' ' + newDv;
        dv = dv.trim();
        output1.push(newDv);
        output2.push(dv);
    }
    return {
        output1: output1.join(','),
        output2: output2.slice(0, 3).join(',')
    }
}

var getCountry = (country) => {
    if (country === 'United States of America' || country === 'United Kingdom' || country === 'France' || country === 'New Zealand' || country === 'Canada') {
        return 'phim-au-my';
    }
    if (country === 'Japan') {
        return 'phim-nhat'
    }
    if (country === 'China' || country === 'Hong Kong') {
        console.log('trung-quoc')
        return 'phim-trung-quoc';
    }
    if (country === 'South Korea') {
        console.log('han quoc')
        return 'phim-han'
    }
    if (country === 'Thailand') {
        return 'phim-thai-lan'
    }
    if (country === 'Vietnam') {
        return 'phim-viet'
    }
    return 'phim-au-my';
}

var callPhim = async (href, cb) => {
    let link = 'http://bilutv.com' + href;
    let post = [];
    let c = new Crawler({
        maxConnections: 10,
        callback: async function (err, res, done) {
            if (err) throw err;
            let $ = res.$;
            let realName = $('.real-name').first().text().split(' ');
            realName[realName.length - 1] = '';
            realName = realName.join(' ').replace('-', '');
            realName = realName.replace('&', '');
            realName = realName.replace('/', '');
            realName = realName.replace('?', '');
            let realnameTag = $('.meta-data').first().children();
            let dienviens = [];
            for (let s of realnameTag['2'].children) {
                if (s.name === 'a') {
                    dienviens.push(s.children[0].data);
                }
            }
            dienviens = dienviens.join(',');
            let xl = xuLyDienVien(dienviens)
            dienviens = xl.output1;
            let label = xl.output2;
            let filmContent = $('.film-content').first().children();
            let linkXem = $('.poster').first().children();
            linkXem = linkXem['0'].attribs.href;
            let tenphim = '';
            if(filmContent['0'].children[0].children[0].data){
               tenphim = filmContent['0'].children[0].children[0].data.replace(',', ' - ');
            }
            let name0 = tenphim.toLowerCase().split('-');
            let name1 = name0[0].trim(); //ten tieng viet
            let name2;
            let name4;
            if (name0[1] && name0[0]) {
                name2 = name0[1].trim();
                name4 = name0[0].trim();
                let name3 = name2.split(' ');
                name3 = name3.slice(0, name3.length - 1);
                name3 = name3.join(' ');
                if (POSTS.includes(name3) || POSTS.includes(name4)) {
                    console.log('___MATCH', name3);
                    return '';
                }
            }

            let motaphim = tenphim + ' ';
            for (let m of filmContent['1'].children) {
                if (m.next === null) {
                    motaphim += m.data;
                }
            }
            let idFilm = await searchThemoviedb(realName, tenphim, motaphim);
            if (idFilm === 0) {
                return;
            }
            let response = await getThemoviedb(idFilm);
            response = JSON.parse(response);
            let anh = 'https://image.tmdb.org/t/p/w500' + response.poster_path;
            let anhCover = 'https://image.tmdb.org/t/p/w500' + response.backdrop_path;
            let theloai = response.genres.map(x => {
                let ketqua = x.name;
                if (ketqua === 'Phim Khoa Học Viễn Tưởng') {
                    ketqua = 'Phim Viễn Tưởng';
                } else if (ketqua === 'Phim Hài') {
                    ketqua = 'Phim Hài Hước';
                }
                ketqua = ' ' + ketqua
                return ketqua;
            });
            let country = response.production_countries[0];
            let quocgia = country !== undefined ? country.name : '';
            let dodai = response.runtime + ' phút';
            let nam = response.release_date;
            let chatluong = 'HD';
            let source = 'http://api.banhtv.net/play.php?url=http://bilutv.com' + linkXem;
            let danhgia = response.vote_average + '/10 điểm với ' +
                response.vote_count + ' lượt đánh giá';
            let code = '<img id="mvi-thumb-data" src="' +
                anh +
                '"/><br/>\n';
            code += '<img id="mvi-cover-data" src="' +
                anhCover +
                '"/><br/>\n';
            code += '<div id="mvi-desc-data">' + motaphim +
                '</div>\n'
            code += '<div id="mvi-status-data">\n[' +
                chatluong +
                ']\n</div>\n'
            code += '<div id="mvi-genre-data">' + theloai +
                '</div>\n'
            code += '<div id="mvi-actor-data">' + dienviens +
                '</div>\n'
            code +=
                '<div id="mvi-director-data">pp_00_' + danhgia + '</div>\n';
            code += '<div id="mvi-country-data">' + quocgia +
                '</div>\n'
            code += '<div id="mvi-duration-data">' + dodai +
                '</div>\n'
            code += '<div id="mvi-res-data">' + chatluong +
                '</div>\n'
            code += '<div id="mvi-year-data">' + nam +
                '</div>\n';
            code += '<div id="mvi-trailer-data"></div>\n';
            code +=
                '<div id="mvi-link-data">\n<id data-src="' +
                source + '"></id>\n</div>'
            return cb({
                html: code,
                label: label + ',phim, phim-le, ' + getCountry(quocgia + '') + ' ,' + theloai,
                name: tenphim
            });
            done();
        }
    });
    c.queue(link);
}
router.get('/phim', function (req, ress, next) {
    let url = req.query.url;
    let count = 0;
    var c = new Crawler({
        maxConnections: 10,
        // This will be called for each crawled page
        callback: async function (error, res, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = res.$;
                var posts = [];
                let ulTag = $(".list-film").first().children();
                let namesPro = Object.getOwnPropertyNames(ulTag);
                for (let property of namesPro) {
                    if (!isNaN(property)) {
                        for (let childA of ulTag[property].children) {
                            if (childA.name + '' === 'a') {
                                await delay(1000);
                                callPhim(childA.attribs.href, (code) => {
                                    if (code !== '') {
                                        posts.push(code);
                                    }
                                });
                            }
                        }

                    }
                }
                await delay(8000);
                return ress.json(posts);

            }
            done();
        }
    });
    c.queue(url);
});

router.get('/blog', async function (req, res, next) {
    let token = req.query.token;
    let options = {
        method: 'GET',
        uri: 'https://www.googleapis.com/blogger/v3/blogs/blogId/posts',
        json: true,
        headers: {
            /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        qs: {
            blogId: '144199127316688870',
            fetchBodies: false,
            maxResults: 500,
            view: 'READER',
            endDate: '2018-07-12T04:18:17.984Z'
        }
    };
    let a = await rp(options);
    let posts = a.items;

    posts = posts.map(function (element) {
        let el = element.title.split('-')[1];
        if (el !== null && el !== undefined) {
            let name0 = el.trim().split(' ');
            name0 = name0.slice(0, name0.length - 1);
            return name0.join(' ').toLowerCase();
        } else return '';
    })
    posts = unique(POSTS);
    return res.json({
        success: true,
        posts: posts
    });

});


module.exports = router;
