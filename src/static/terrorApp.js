
        queue()
            .defer(d3.json, "/data")
            .await(makeGraphs);
        var tabelChart = dc.dataTable(".dc-data-table");
        var ndx;

        function makeGraphs(error, projectsJson) {
            var data = projectsJson;

            ndx = crossfilter(data);
             $(".resetall").click(function() {
                    $(".resetall").attr("disabled", false);
                    dc.filterAll();
                    dc.renderAll();
                })

            var barContinentDim = ndx.dimension(function(d) {
                return d["region_txt"]
            });
            var yearlyHitsDim = ndx.dimension(function(d) {
                return d["iyear"]
            });
            var countryDim = ndx.dimension(function(d) {
                return d["country_txt"].toLowerCase()
            });
            var attackTypeDim = ndx.dimension(function(d) {
                return d["attacktype1_txt"]
            });
            var filterDim = ndx.dimension(function(d) {
                return d["gname"].toLowerCase()+d["targtype1_txt"].toLowerCase()+
                    d["country_txt"].toLowerCase() + d['attacktype1_txt'].toLowerCase() + d['iyear'];
            });
              var targets=ndx.dimension(function(d) {
                return d["targtype1_txt"]
                }
            );





            var barContinent = dc.barChart("#bar_continent");
            var yearlyHitsChart = dc.lineChart('.yearly-hits');
            var countryPieChart = dc.pieChart('.targeted-Countries');
            var attackTypeLChart = dc.rowChart('.attack-type');
            var visCount = dc.dataCount(".dc-data-count");
            var targetChart = dc.bubbleChart(".target-bubble-chart");



            var barContinentDimGroup = barContinentDim.group();
            var countryDimGroup = countryDim.group();
            var attackTypeDimGroup = attackTypeDim.group();
            var statsByTargets = targets.group().reduce (

                function (p, v) {
                      if(!isNaN(+v['nkill'])) {
                          p.killed += +v['nkill'];

                      }
                      if(!isNaN(+v['nwound'])){
                           p.wounded += +v['nwound'];

                      }
                       return p;
                   },
                function(p, v) {
                     if(!isNaN(v['nkill'])) {
                         p.killed -= +v["nkill"];
                     }
                     if(!isNaN(v['nwound'])){
                         p.wounded -= +v["nwound"];
                     }
                    return p;
                },
               function () {
                    return {killed: 0, wounded: 0}
                }


            );


            var chart = dc.inputFilter("#search-input")
                .dimension(filterDim)

            var all = ndx.groupAll();

            barContinent
                .width(800)
                .height(300)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .yAxisLabel("Number of Hits")
                .dimension(barContinentDim)
                .renderHorizontalGridLines(true)
                .renderVerticalGridLines(true)
                .barPadding(0.4)
                .outerPadding(0.01)
                .colors(d3.scale.ordinal().domain(["low", "med", "high"])
                    .range(["#ccc", "#d0e5cc", "#CF1919"]))
                .colorAccessor(function(d) {
                    if (d.value < 10000)
                        return "positive"
                    else if (d.value < 25000)
                        return "med"
                    return "high";
                })

            .group(barContinentDimGroup)
                .label(function(d) {
                    return (d.data.value / ndx.groupAll().reduceCount().value() * 100).toFixed(1) + "%";
                })
                .renderLabel(true)
                .elasticY(true)
                .yAxisPadding('10%')
                .y(d3.scale.linear().domain([0, 55000]))
                .margins({
                    top: 5,
                    right: 0,
                    bottom: 140,
                    left: 60
                })
                .on("postRender", function(c) {
                    adjustBarChartLabels(c);
                    c.svg()
                        .selectAll("rect.bar")
                        .on("click.scroll", function(d) {
                            scrollTo(d.data.key);
                        });
                });
            yearlyHitsChart
                .height(200)
                .width(500)
                .margins({
                    top: 10,
                    right: 50,
                    bottom: 40,
                    left: 40
                })
                .dimension(yearlyHitsDim)
                .group(yearlyHitsDim.group())
                .renderArea(true)

            .x(d3.scale.linear().domain([new Date(1970), new Date(2018)]))
                .elasticY(true)
                .on("postRender", function(c) {
                    adjustBarChartLabels(c);
                    c.svg()
                        .selectAll("rect")
                        .on("click.scroll", function(d) {
                            scrollTo(d.data.key);
                        });
                })
                .xAxis().ticks(10).tickFormat(d3.format("d"));


         countryPieChart
                .width(400)
                .height(300)
                .radius(80)
                .innerRadius(20)
                .dimension(countryDim)
                .group(countryDimGroup)
                .legend(dc.legend())

            .label(function(d) {
                return  " (" + Math.floor(d.value / all.value() * 100) + "%)";
            })
            .data(function(group) {
                return group.top(5)
            });
            attackTypeLChart
                .dimension(attackTypeDim)
                .group(attackTypeDimGroup)
                .elasticX(true)
                .width(500)
                .x(d3.scale.linear().domain([0, 85000]))
                .data(function(group) {
                    return group.top(10)
                })

                 .xAxis().ticks(4).tickFormat(d3.format("d"));

            visCount
                .dimension(ndx)
                .group(all);

            tabelChart
                .width(400)
                .height(480)
                .dimension(yearlyHitsDim)
                .group(function(d) {
                    return +d["iyear"] + '/' + +d["imonth"];

                })
                .size(Infinity)

            .columns
                ([
                    {
                        label: "Date",
                        format: function(d) {
                            return d["iday"];
                        }
                    }, {
                        label: "Country",
                        format: function(d) {
                            return d["country_txt"];
                        }
                    },

                    {
                        label: "Type of Hit",
                        format: function(d) {
                            return d["attacktype1_txt"];
                        }
                    },

                    {
                        label: "Target",
                        format: function(d) {
                            return d["targtype1_txt"];
                        }
                    },

                    {
                        label: "Group",
                        format: function(d) {
                            return d["gname"];
                        }
                    },

                ])


               .sortBy(function (d) { return [+d['iyear'], (+d['month'])]; })
            targetChart
                .height(300)
                .width(600)
                .dimension(targets)
                .group(statsByTargets)
                .margins({top: 30, right: 50, bottom: 30, left: 60})
                .colors(d3.scale.category10())
                .keyAccessor(function (p) {
                        return p.value.killed;
                })
                .valueAccessor(function (p) {
                        return p.value.wounded;
                })
                .radiusValueAccessor(function (p) {
                        return p.value.killed;
                })
                .x(d3.scale.linear().domain([0, 140000]))
                .r(d3.scale.linear().domain([0,140000]))

                .yAxisPadding(40000)
                .xAxisPadding(30000)
                .elasticX(true)
                .maxBubbleRelativeSize(0.07)
                .renderHorizontalGridLines(true)
                .renderVerticalGridLines(true)
                .renderLabel(true)
                .renderTitle(true)
                .title(function (p) {
                        return p.key
                                + "\n"
                                + "Fatalities: " + p.value.killed +"\n"
                                + "Injuries: " + p.value.wounded;
                    })
            targetChart.yAxis().tickFormat(d3.format("s"))
            targetChart.xAxis().tickFormat(d3.format("s"))
            targetChart.xAxisLabel("Number of Deaths")
            targetChart.yAxisLabel("Number of Injuries")

            function adjustBarChartLabels(chart) {
                chart.svg()
                    .selectAll('.axis.x text')
                    .on("click", function(d) {
                        chart.filter(d);
                        dc.redrawAll();
                        scrollTo(d);
                    })
                    .style("text-anchor", "end")
                    .attr("dx", function(d) {
                        return "-0.7em";
                    })
                    .attr("dy", function(d) {
                        return "-7px";
                    })
                    .attr("transform", function(d) {
                        return "rotate(-75)"
                    });
            }

            update();

            dc.renderAll();
        }

            var ofs = 0,
                pag = 17;

            function display() {
                d3.select('#begin')
                    .text(ofs);
                d3.select('#end')
                    .text(ofs + pag - 1);
                d3.select('#last')
                    .attr('disabled', ofs - pag < 0 ? 'true' : null);
                d3.select('#next')
                    .attr('disabled', ofs + pag >= ndx.size() ? 'true' : null);
                d3.select('#size').text(ndx.size());
            }

            function update() {
                tabelChart.beginSlice(ofs);
                tabelChart.endSlice(ofs + pag);
                display();
            }

            function next() {
                ofs += pag;
                update();
                tabelChart.redraw();
            }

            function last() {
                ofs -= pag;
                update();
                tabelChart.redraw();
            }


