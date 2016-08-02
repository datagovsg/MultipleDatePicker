'use strict';

var _ = require('lodash');

/*
 @author : Maelig GOHIN For ARCA-Computing - www.arca-computing.fr
 @version: 2.0.2

 @description:  MultipleDatePicker is an Angular directive to show a simple calendar allowing user to select multiple dates.
 Css style can be changed by editing less or css stylesheet.
 See scope declaration below for options you can pass through html directive.
 Feel free to edit and share this piece of code, our idea is to keep it simple ;)

 Demo page : http://arca-computing.github.io/MultipleDatePicker/
 */
(function (angular) {
    var multipleDatePicker = function multipleDatePicker() {
        return {
            restrict: 'AE',
            scope: {
                /*
                 * Type : Array of moment dates
                 * Array will mutate when user select/unselect a date
                 */
                ngModel: '=?',
                /*
                 * Type: array of objects (see doc)
                 * Days to highlights
                 * */
                highlightDays: '=?',
                /*
                 * Type : function
                 * Will be called to manage (un)selection of a date
                 */
                dayClick: '=?',
                /*
                 * Type : function
                 * Will be called to manage hover of a date
                 */
                dayHover: '=?',

                /*
                 * Type: moment date
                 * Month to be displayed
                 * Default is current month
                 */
                month: '=?',

                /*
                 * Type: function(newMonth, oldMonth)
                 * Will be called when month changed
                 * Param newMonth/oldMonth will be the first day of month at midnight
                 * */
                monthChanged: '=?',
                /*
                 * Type: array of integers
                 * Recurrent week days not selectables
                 * /!\ Sunday = 0, Monday = 1 ... Saturday = 6
                 * */
                weekDaysOff: '=?',
                /*
                 * Type: boolean
                 * Set all days off
                 * */
                allDaysOff: '=?',
                /*
                 * Type: array of moment dates
                 * Set days allowed (only thos dates will be selectable)
                 * */
                daysAllowed: '=?',
                /*
                 * Type: boolean
                 * Sunday be the first day of week, default will be Monday
                 * */
                sundayFirstDay: '=?',
                /*
                 * Type: boolean
                 * if true can't go back in months before today's month
                 * */
                disallowBackPastMonths: '=?',
                /*
                 * Type: boolean
                 * if true can't go in futur months after today's month
                 * */
                disallowGoFuturMonths: '=?',
                /*
                 * Type: boolean
                 * if true empty boxes will be filled with days of previous/next month
                 * */
                showDaysOfSurroundingMonths: '=?',
                /*
                 * Type: string
                 * CSS classes to apply to days of next/previous months
                 * */
                cssDaysOfSurroundingMonths: '=?',
                /*
                 * Type: boolean
                 * if true events on empty boxes (or next/previous month) will be fired
                 * */
                fireEventsForDaysOfSurroundingMonths: '=?',
                /*
                 * Type: any type moment can parse
                 * If filled will disable all days before this one (not included)
                 * */
                disableDaysBefore: '=?',
                /*
                 * Type: any type moment can parse
                 * If filled will disable all days after this one (not included)
                 * */
                disableDaysAfter: '=?',

                /*
                   Type: integers
                   */
                utcOffset: '=?'
            },
            template: '\n<div class="multiple-date-picker">\n    <div class="picker-top-row">\n        <div class="text-center picker-navigate picker-navigate-left-arrow"\n             ng-class="{\'disabled\':disableBackButton}" ng-click="previousMonth()">&lt;</div\n             ><div class="text-center picker-month">{{month.format(\'MMMM YYYY\')}}</div\n             ><div class="text-center picker-navigate picker-navigate-right-arrow"\n             ng-class="{\'disabled\':disableNextButton}" ng-click="nextMonth()">&gt;</div>\n    </div>\n  <div class="picker-days-week-row">\n    <div class="text-center" ng-repeat="day in daysOfWeek">{{day}}</div>\n  </div>\n  <div class="picker-days-row">\n    <div class="text-center\n                picker-day\n                {{!day.mdp.otherMonth || showDaysOfSurroundingMonths ? day.css : \'\'}}\n                {{ day.mdp.otherMonth ? cssDaysOfSurroundingMonths : \'\'}}"\n         title="{{day.title}}"\n         ng-repeat="day in days track by $index"\n         ng-click="toggleDay($event, day)"\n         ng-mouseover="hoverDay($event, day)"\n         ng-mouseleave="dayHover($event, day)"\n         ng-class="{\n            \'picker-selected\':    is.selected(day.date),\n            \'picker-off\':         !day.selectable,\n            \'today\':              day.mdp.today,\n            \'past\':               day.mdp.past,\n            \'future\':             day.mdp.future,\n            \'picker-other-month\': day.mdp.otherMonth\n          }">\n          {{day ? day.mdp.otherMonth && !showDaysOfSurroundingMonths ? \'&nbsp;\' : day.date.format(\'D\') : \'\'}}\n\n          <div ng-if="day.annotation" class="annotation">\n            {{day.annotation}}\n          </div>\n    </div>\n  </div>\n</div>',
            link: function link(scope) {

                scope.ngModel = scope.ngModel || [];

                /* Optimizations to speed things up */
                scope.cache = {
                    selectedDates: {},
                    highlightDays: {},
                    daysAllowed: {},
                    today: moment()
                };

                scope.is = {
                    selected: function selected(dv) {
                        return dv.valueOf() in scope.cache.selectedDates;
                    }
                };

                /*utility functions*/
                var checkNavigationButtons = function checkNavigationButtons() {
                    var today = moment(),
                        previousMonth = moment(scope.month).subtract(1, 'month'),
                        nextMonth = moment(scope.month).add(1, 'month');
                    scope.disableBackButton = scope.disallowBackPastMonths && today.isAfter(previousMonth, 'month');
                    scope.disableNextButton = scope.disallowGoFuturMonths && today.isBefore(nextMonth, 'month');
                },
                    getDaysOfWeek = function getDaysOfWeek() {
                    /*To display days of week names in moment.lang*/
                    var momentDaysOfWeek = moment().localeData()._weekdaysMin,
                        days = [];

                    for (var i = 1; i < 7; i++) {
                        days.push(momentDaysOfWeek[i]);
                    }

                    if (scope.sundayFirstDay) {
                        days.splice(0, 0, momentDaysOfWeek[0]);
                    } else {
                        days.push(momentDaysOfWeek[0]);
                    }

                    return days;
                };

                /*scope functions*/
                // FIXME: Use shallower watch functions here
                scope.$watch(function () {
                    return scope.ngModel.map(function (m) {
                        return m.valueOf();
                    });
                }, function (selectedDates) {
                    scope.cache.selectedDates = selectedDates ? _.keyBy(selectedDates, function (m) {
                        return m.valueOf();
                    }) : {};
                }, true);

                scope.$watch('highlightDays', function (hlDays) {
                    if (angular.isArray(hlDays)) {
                        scope.cache.highlightDays = _.keyBy(hlDays, function (hld) {
                            var hldMoment = moment(hld.date);
                            return Date.UTC(hldMoment.year(), hldMoment.month(), hldMoment.date());
                        });
                    } else {
                        scope.cache.highlightDays = {};
                    }
                }, true);

                scope.$watch(function () {
                    return scope.daysAllowed && scope.daysAllowed.map(function (m) {
                        return m.valueOf();
                    });
                }, function () {
                    if (angular.isArray(scope.daysAllowed)) {
                        scope.cache.daysAllowed = _.keyBy(scope.daysAllowed, function (hld) {
                            var hldMoment = moment(hld);
                            return Date.UTC(hldMoment.year(), hldMoment.month(), hldMoment.date());
                        });
                    } else {
                        scope.cache.daysAllowed = {};
                    }
                }, true);

                scope.$watchGroup([
                // 'cache.selectedDates', // not this one -- this one is more optimized
                'cache.highlightDays', 'cache.daysAllowed', 'weekDaysOff', // FIXME: Not exactly correct (needs deep)
                'allDaysOff'], function () {
                    scope.generate();
                });

                //default values
                scope.month = scope.month || moment().startOf('day');
                scope.days = [];
                scope.weekDaysOff = scope.weekDaysOff || [];
                scope.daysOff = scope.daysOff || [];
                scope.disableBackButton = false;
                scope.disableNextButton = false;
                scope.daysOfWeek = getDaysOfWeek();
                scope.cssDaysOfSurroundingMonths = scope.cssDaysOfSurroundingMonths || 'picker-empty';

                /**
                 * Called when user clicks a date
                 * @param event event the click event
                 * @param day "complex" mdp object with all properties
                 */
                scope.toggleDay = function (event, day) {
                    event.preventDefault();

                    if (day.mdp.otherMonth && !scope.fireEventsForDaysOfSurroundingMonths) {
                        return;
                    }

                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayClick == 'function') {
                        scope.dayClick(event, day);
                    }

                    if (day.selectable && !prevented) {
                        if (_.some(scope.ngModel, function (m) {
                            return m.isSame(day.date, 'day');
                        })) {
                            scope.ngModel = _.filter(scope.ngModel, function (m) {
                                return !m.isSame(day.date, 'day');
                            });
                        } else {
                            scope.ngModel.push(day.date);
                        }
                    }
                };

                /**
                 * Hover day
                 * @param event hover event
                 * @param day "complex" mdp object with all properties
                 */
                scope.hoverDay = function (event, day) {
                    event.preventDefault();
                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayHover == 'function') {
                        scope.dayHover(event, day);
                    }
                };

                /*Navigate to previous month*/
                scope.previousMonth = function () {
                    if (!scope.disableBackButton) {
                        var oldMonth = moment(scope.month);
                        scope.month = scope.month.subtract(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Navigate to next month*/
                scope.nextMonth = function () {
                    if (!scope.disableNextButton) {
                        var oldMonth = moment(scope.month);
                        scope.month = scope.month.add(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Check if the date is off : unselectable*/
                scope.isDayOff = function (day) {
                    var dateRef = Date.UTC(day.date.year(), day.date.month(), day.date.date());
                    return scope.allDaysOff || !!scope.disableDaysBefore && moment(day.date).isBefore(scope.disableDaysBefore, 'day') || !!scope.disableDaysAfter && moment(day.date).isAfter(scope.disableDaysAfter, 'day') || angular.isArray(scope.weekDaysOff) && scope.weekDaysOff.some(function (dayOff) {
                        return day.date.day() === dayOff;
                    }) || angular.isArray(scope.daysOff) && scope.daysOff.some(function (dayOff) {
                        return day.date.isSame(dayOff, 'day');
                    }) || !scope.cache.daysAllowed || !scope.cache.daysAllowed[dateRef] || dateRef in scope.cache.highlightDays && !scope.cache.highlightDays[dateRef].selectable;
                };

                /*Check if the date is selected*/
                scope.isSelected = function (day) {
                    return scope.ngModel.some(function (d) {
                        return day.date.isSame(d, 'day');
                    });
                };

                /*Generate the calendar*/
                scope.generate = function () {
                    var previousDay = moment(scope.month).date(0).day(scope.sundayFirstDay ? 0 : 1).subtract(1, 'day');

                    if (moment(scope.month).date(0).diff(previousDay, 'day') > 6) {
                        previousDay = previousDay.add(1, 'week');
                    }

                    var firstDayOfMonth = moment(scope.month).date(1),
                        days = [],
                        now = moment(),
                        lastDay = moment(firstDayOfMonth).endOf('month'),
                        createDate = function createDate() {
                        var day = {
                            date: moment(previousDay.add(1, 'day')),
                            dateValue: 0,
                            annotation: null,
                            mdp: {}
                        };

                        day.dateValue = day.date.valueOf();

                        var dayKey = Date.UTC(day.date.year(), day.date.month(), day.date.date());

                        if (angular.isArray(scope.highlightDays)) {
                            // Assume it's cached
                            var hlDay = scope.cache.highlightDays[dayKey];

                            if (hlDay) {
                                day.css = hlDay.css;
                                day.title = hlDay.title;
                                day.annotation = hlDay.annotation;
                            } else {
                                day.css = '';
                                day.title = '';
                                day.annotation = null;
                            }
                        }
                        day.selectable = !scope.isDayOff(day);

                        /* Date computations are expensive, so cache the values */
                        day.mdp.today = day.date.isSame(now, 'day');
                        day.mdp.past = day.date.isBefore(now, 'day');
                        day.mdp.future = day.date.isAfter(now, 'day');
                        if (!day.date.isSame(scope.month, 'month')) {
                            day.mdp.otherMonth = true;
                        }
                        return day;
                    },
                        maxDays = lastDay.diff(previousDay, 'days'),
                        lastDayOfWeek = scope.sundayFirstDay ? 6 : 0;

                    if (lastDay.day() !== lastDayOfWeek) {
                        maxDays += (scope.sundayFirstDay ? 6 : 7) - lastDay.day();
                    }

                    for (var j = 0; j < maxDays; j++) {
                        days.push(createDate());
                    }

                    scope.days = days;
                    checkNavigationButtons();
                };
            }
        };
    };

    angular.module('multipleDatePicker', []).directive('multipleDatePicker', multipleDatePicker);
})(window.angular);