---
layout: post
title: Visualization
---

## Overview

The visualization technique I chose is a choropleth map mixed with a symbol map. 

The coloring of each neighborhood depicts the buyout amount per capita, or translated, how willing or aggresive the landlords are to buy their tenants out. To read more about what buyout agreements are, you can go back to the [main page](../index.html).

## Interactivity 
If we hover over a neighborhood, we can see it's details pop-up in the upper left corner. Here we can see the population, as well as rougly the transparency, so for example Outer Richmond has 86 buyouts with available information, and 115 with partial. We can also see the average buyout amount for the neighborhood calculated based on available info.

If we scroll a bit down, but still keep hover over a neighborhood, we will also be able to see two line charts generated on-demand. The left line chart shows the total amount trend per year throughout the time period. The right one depicts a number of buyouts per that same time period. Again, this is for buyouts for which we have available data. The line charts get created on-demand, as we hover over different neighborhoods.

The symbols depict actual buyouts, and the color encoding represents the number of tenants. We are able to see the legend in the right corner. For simplicity, they are grouped into three categories. Since the area is somewhat crowded, I added zooming for more specific selection, although it can cause some latency.

If we hover over a specific buyout agreement we can see some metadata about location. But we can also see the agreement specifics as well as how it compares to the average of the neighborhood.

## Caveats

It's worth noting that the numbers are significantly lower than in actuality, as many datapoints have incomplete data.

## Conclusions
As you can see central parts and the Mission district are the most critical areas. If we look at trendlines for neighborhoods, we can see that the general trend both in amount and number of buyouts is upwards.

As mentioned, this is mostly an exloratory visualization, so if you particularly interested in how your neighborhood is doing, you should be able to draw some conslusion.


<div>
<svg width="960" height="600" id="vis">
<g id="basemap"></g>

<!-- turn off pointer events for certain groups -->
<g id="outline" pointer-events="none"></g>
<g id="tooltip" pointer-events="none"></g>
<g id="details" pointer-events="none"></g>
<g id="buyouts"></g>
</svg>
<br><br>
<svg width="960" height="600" id="line"></svg>
</div>



Some data

<script src="https://d3js.org/d3.v5.js"></script>
<script src="../js/map.js"></script>
<link href="../css/style.css" rel="stylesheet">

Some data