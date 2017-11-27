var express = require('express');
var router = express.Router();

/* PostgreSQL and PostGIS module and connection setup */
var pg = require("pg");
var conString = "postgres://postgres:@localhost:5432/pdt_rivers_2";
var client = new pg.Client(conString);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET the map page */
router.get('/map', function(req, res) {
    client.connect();
    res.render('map', {
        title: "PDT-RIVERS"
    })
});

router.get('/isRiver', function(req, res, next) {
    var qlat = req.query.pointLat;
    var qlon = req.query.pointLon;
    var qtxt = "select row_to_json(ir) from (SELECT st_dwithin((the_geom), (st_setsrid(st_point(" + qlon + ", " + qlat +
        "), 4326)), 0.0001) is_river from ways order by is_river desc limit 1) as ir";

    var query = client.query(qtxt);
    query.then(function (result) {
        res.send(result.rows[0].row_to_json.is_river.toString());
    });

});

router.get('/withTime', function(req, res, next) {
    var distance = req.query.dist;
    var qlat = req.query.pointLat;
    var qlon = req.query.pointLon;

    var qtxt = "with point1 as (" +
        "select source from ways where " +
        "st_dwithin((the_geom), " +
        "(st_setsrid(st_point(" + qlon + ", " + qlat + "), 4326)), 0.0001) limit 1)," +
        "all_points as (" +
        "select source from ways where " +
        "st_dwithin((the_geom)::geography, " +
        "(st_setsrid(st_point(" + qlon + ", " + qlat + "), 4326))::geography, " + distance + "))" +
        "select row_to_json(fc) from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features from " +
        "(select 'Feature' as type, st_asgeojson(pp.the_geom)::json as geometry, row_to_json((pp.node, pp.name)) as properties from " +
        "(select the_geom, node, name from " +
        "pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', (select source from point1), array(select source from all_points " +
        "where source in (select end_vid from pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', " +
        "(select source from point1), array(select source from all_points), false) dij join ways on dij.edge = ways.gid " +
        "group by end_vid having sum(length_m) < " + distance + ") " +
        "), false) dij join ways on dij.edge = ways.gid " +
        "group by the_geom, node, name) as pp) as f) as fc";

    var query = client.query(qtxt);
    query.then(function (result) {
        res.send(result.rows[0].row_to_json);
    });
});

router.get('/withTwoPoints', function(req, res, next) {
    var qlat1 = req.query.pointLat1;
    var qlon1 = req.query.pointLon1;
    var qlat2 = req.query.pointLat2;
    var qlon2 = req.query.pointLon2;
    var qtxt = "with point1 as (" +
                    "select source from ways where " +
                    "st_dwithin((the_geom), " +
                    "(st_setsrid(st_point(" + qlon1 + ", " + qlat1 + "), 4326)), 0.0001) limit 1), " +
                "point2 as (" +
                    "select source from ways where " +
                    "st_dwithin((the_geom), " +
                    "(st_setsrid(st_point(" + qlon2 + ", " + qlat2 + "), 4326)), 0.0001) limit 1) " +
                "select row_to_json(fc) from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features from ( " +
                "select 'Feature' as type, st_asgeojson(pp.the_geom)::json as geometry, row_to_json((pp.node, (pp.length_m)::text)) as properties from " +
                "(select node, name, length_m, the_geom from " +
                "pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', (select source from point1), (select source from point2), false) dij " +
                "join ways on dij.edge = ways.gid) as pp) as f) as fc";

    var query = client.query(qtxt);
    query.then(function (result) {
        res.send(result.rows[0].row_to_json);
    });
})

router.get('/withDistance', function(req, res, next) {
    var distance = req.query.dist;
    var qlat = req.query.pointLat;
    var qlon = req.query.pointLon;

    var qtxt = "with point1 as (" +
                      "select source from ways where " +
                      "st_dwithin((the_geom), " +
                      "(st_setsrid(st_point(" + qlon + ", " + qlat + "), 4326)), 0.0001) limit 1)," +
                "all_points as (" +
                      "select source from ways where " +
                      "st_dwithin((the_geom)::geography, " +
                      "(st_setsrid(st_point(" + qlon + ", " + qlat + "), 4326))::geography, " + distance + "))" +
                "select row_to_json(fc) from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features from " +
                "(select 'Feature' as type, st_asgeojson(pp.the_geom)::json as geometry, row_to_json((pp.node, pp.name)) as properties from " +
                "(select the_geom, node, name from " +
                "pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', (select source from point1), array(select source from all_points " +
                   "where source in (select end_vid from pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', " +
                       "(select source from point1), array(select source from all_points), false) dij join ways on dij.edge = ways.gid " +
                       "group by end_vid having sum(length_m) < " + distance + ") " +
                "), false) dij join ways on dij.edge = ways.gid " +
                "group by the_geom, node, name) as pp) as f) as fc";

    var query = client.query(qtxt);
    query.then(function (result) {
        res.send(result.rows[0].row_to_json);
    });
});

module.exports = router;
