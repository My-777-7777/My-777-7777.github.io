// =============================================
// D3 timeline of my experience (data from my resume)
// end: null means I'm still doing it
// =============================================
const experiences = [
  { org: "Green Horizon Initiative", role: "Founder & Project Leader", type: "Leadership", start: "2023-09", end: null },
  { org: "Hongzheng Lide Capital", role: "Intern, Investment Management", type: "Internship", start: "2024-05", end: "2024-06" },
  { org: "Zhongjihua Engineering", role: "U.S. General Manager & Project Manager", type: "Full-time", start: "2024-09", end: null },
  { org: "CICC Wealth Management", role: "Intern, Wealth Management", type: "Internship", start: "2025-07", end: "2025-08" },
  { org: "Guangdong Nanyue Bank", role: "Intern, Corporate Finance", type: "Internship", start: "2026-01", end: "2026-04" },
  { org: "Hainan Yimo Investment", role: "Investment Research Intern", type: "Internship", start: "2026-03", end: "2026-09" }
];

const parseMonth = d3.timeParse("%Y-%m");
const formatMonth = d3.timeFormat("%b %Y");
const today = new Date();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// turn the text dates into real dates
experiences.forEach(d => {
  d.startDate = parseMonth(d.start);
  // a role that ended in June lasts until the start of July
  d.endDate = d.end ? d3.timeMonth.offset(parseMonth(d.end), 1) : today;
  d.dates = formatMonth(d.startDate) + " to " + (d.end ? formatMonth(parseMonth(d.end)) : "present");
});

// one color per type of role (same colors as the CSS)
const color = d3.scaleOrdinal()
  .domain(["Full-time", "Internship", "Leadership"])
  .range(["#1b2a41", "#c8102e", "#2e7d5b"]);

// legend above the chart
d3.select("#timeline-legend")
  .selectAll("span")
  .data(color.domain())
  .join("span")
  .attr("class", "legend-item")
  .html(d => `<i style="background:${color(d)}"></i>${d}`);

const container = d3.select("#timeline");
const tooltip = d3.select("body").append("div").attr("class", "tooltip");

function drawChart() {
  container.selectAll("*").remove();

  // on phones, put the names above the bars instead of on the left
  const fullWidth = container.node().clientWidth;
  const narrow = fullWidth < 600;
  const margin = narrow
    ? { top: 28, right: 24, bottom: 36, left: 8 }
    : { top: 28, right: 40, bottom: 36, left: 190 };
  const width = fullWidth - margin.left - margin.right;
  const height = experiences.length * (narrow ? 58 : 46);

  const svg = container.append("svg")
    .attr("width", fullWidth)
    .attr("height", height + margin.top + margin.bottom)
    .attr("role", "img")
    .attr("aria-label", "Timeline of Peisong Yuan's roles from 2023 to today");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scales
  const x = d3.scaleTime()
    .domain([parseMonth("2023-07"), d3.timeMonth.offset(today, 2)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(experiences.map(d => d.org))
    .range([0, height])
    .padding(narrow ? 0.5 : 0.32);

  // x axis with light grid lines every 6 months
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .ticks(narrow ? d3.timeYear.every(1) : d3.timeMonth.every(6))
      .tickFormat(d3.timeFormat(narrow ? "%Y" : "%b %Y"))
      .tickSize(-height)
      .tickPadding(10))
    .call(axis => axis.select(".domain").remove());

  // company names: on the left on big screens, above each bar on phones
  if (narrow) {
    g.selectAll(".bar-label")
      .data(experiences)
      .join("text")
      .attr("class", "bar-label")
      .attr("x", 0)
      .attr("y", d => y(d.org) - 6)
      .text(d => d.org);
  } else {
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(12))
      .call(axis => axis.select(".domain").remove());
  }

  // dashed line for today
  g.append("line")
    .attr("class", "today-line")
    .attr("x1", x(today))
    .attr("x2", x(today))
    .attr("y1", -6)
    .attr("y2", height);

  g.append("text")
    .attr("class", "today-label")
    .attr("x", x(today))
    .attr("y", -12)
    .attr("text-anchor", "middle")
    .text("Today");

  // one bar per role
  g.selectAll(".bar")
    .data(experiences)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.startDate))
    .attr("y", d => y(d.org))
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("fill", d => color(d.type))
    .attr("width", 0)
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.role}</strong><br>${d.org}<br><span>${d.dates}</span>`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0))
    .transition()
    .duration(reduceMotion ? 0 : 900)
    .delay((d, i) => reduceMotion ? 0 : i * 120)
    .attr("width", d => Math.max(x(d.endDate) - x(d.startDate), 4));
}

drawChart();

// redraw when the window size changes
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawChart, 200);
});
