// components/reports.js — Reports UI for usage statistics (ES module)

import * as Stats from '../stats.js';
import * as Lang from '../lang.js';

var reportsPage = document.getElementById('reportsPage');
var reportOpenBtn = document.getElementById('reportOpenBtn');
var reportsBack = document.getElementById('reportsBack');
var reportTabs = document.getElementById('reportTabs');
var reportSummary = document.getElementById('reportSummary');
var reportWordBars = document.getElementById('reportWordBars');
var reportDeckBars = document.getElementById('reportDeckBars');
var reportAiStats = document.getElementById('reportAiStats');

var currentRange = 'today';

function getData() {
  switch (currentRange) {
    case 'week': return Stats.getWeek();
    case 'month': return Stats.getMonth();
    default: return Stats.getToday();
  }
}

function render() {
  var data = getData();
  renderSummary(data);
  renderTopWords(data);
  renderTopDecks(data);
  renderAiStatsSection(data);
}

function renderSummary(data) {
  var totalWords = 0;
  var topWord = '\u2014';
  var topCount = 0;
  for (var w in data.cardTaps) {
    totalWords += data.cardTaps[w];
    if (data.cardTaps[w] > topCount) {
      topCount = data.cardTaps[w];
      topWord = w;
    }
  }

  var avgWords = data.wordsPerSentence.length > 0
    ? (data.wordsPerSentence.reduce(function (a, b) { return a + b; }, 0) /
       data.wordsPerSentence.length).toFixed(1)
    : '\u2014';

  var hours = Math.floor(data.sessionMinutes / 60);
  var mins = data.sessionMinutes % 60;
  var timeStr = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';

  reportSummary.innerHTML =
    card(totalWords, Lang.t('reportWordsUsed')) +
    card(data.sentencesSpoken, Lang.t('reportSentences')) +
    card(topWord, Lang.t('reportTopWord')) +
    card(timeStr, Lang.t('reportSessionTime'));
}

function card(value, label) {
  return '<div class="report-card">' +
    '<div class="report-card-value">' + value + '</div>' +
    '<div class="report-card-label">' + label + '</div>' +
  '</div>';
}

function renderTopWords(data) {
  renderBars(reportWordBars, data.cardTaps, 10);
}

function renderTopDecks(data) {
  renderBars(reportDeckBars, data.deckOpens, 5);
}

function renderBars(container, obj, limit) {
  var entries = [];
  for (var k in obj) entries.push({ label: k, count: obj[k] });
  entries.sort(function (a, b) { return b.count - a.count; });
  entries = entries.slice(0, limit);

  var max = entries.length > 0 ? entries[0].count : 1;

  container.innerHTML = '';
  if (entries.length === 0) {
    container.innerHTML = '<div class="report-empty">' + Lang.t('reportNoData') + '</div>';
    return;
  }
  for (var i = 0; i < entries.length; i++) {
    var pct = Math.round((entries[i].count / max) * 100);
    var row = document.createElement('div');
    row.className = 'report-bar-row';
    row.innerHTML =
      '<span class="report-bar-label">' + entries[i].label + '</span>' +
      '<div class="report-bar-track"><div class="report-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="report-bar-count">' + entries[i].count + '</span>';
    container.appendChild(row);
  }
}

function renderAiStatsSection(data) {
  reportAiStats.innerHTML =
    '<div class="setting-row">' +
      '<span class="setting-label">' + Lang.t('reportSmartSentences') + '</span>' +
      '<span class="report-stat-value">' + data.aiAssistUsed + '</span>' +
    '</div>' +
    '<div class="setting-row">' +
      '<span class="setting-label">' + Lang.t('reportSuggestionsUsed') + '</span>' +
      '<span class="report-stat-value">' + data.suggestionsUsed + '</span>' +
    '</div>';
}

export function init() {
  if (!reportsPage || !reportOpenBtn) return;

  reportOpenBtn.onclick = function () {
    Stats.flushSession();
    reportsPage.classList.add('open');
    render();
  };
  reportsBack.onclick = function () {
    reportsPage.classList.remove('open');
  };

  reportTabs.addEventListener('click', function (e) {
    var tab = e.target.closest('.report-tab');
    if (!tab) return;
    var tabs = reportTabs.querySelectorAll('.report-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    tab.classList.add('active');
    currentRange = tab.dataset.range;
    render();
  });
}
