/**
 * 此JS文件是格式化JS中日期时间的工具类，其中包含了传入日期对象Date，格式化成想要的格式，<br>
* 或者传入字符串格式的时间个，次字符串日期对应的格式可以转换为相应的日期对象，<br>
* 可以计算两个日期之间的差值
*
* y: 表示年
* M：表示一年中的月份 1~12
* d: 表示月份中的天数 1~31
* H：表示一天中的小时数 00~23
* m: 表示小时中的分钟数 00~59
* s: 表示分钟中的秒数   00~59
*/

var DateFormat = function(bDebug){
    this.isDebug = bDebug || false;
    this.curDate = new Date();
}

DateFormat.prototype = {
        //定义一些常用的日期格式的常量
        DEFAULT_DATE_FORMAT: 'yyyy-MM-dd',
        DEFAULT_MONTH_FORMAT: 'yyyy-MM',
        DEFAULT_YEAR_FORMAT: 'yyyy',
        DEFAULT_TIME_FORMAT: 'HH:mm:ss',
        DEFAULT_DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
        DEFAULT_YEAR: 'YEAR',
        DEFAULT_MONTH: 'MONTH',
        DEFAULT_DATE: 'DATE',
        DEFAULT_HOUR: 'HOUR',
        DEFAULT_MINUTE: 'MINUTE',
        DEFAULT_SECOND: 'SECOND',

        /**
         * 根据给定的日期时间格式，格式化当前日期
         * @params strFormat 格式化字符串， 如："yyyy-MM-dd" 默认格式为：“yyyy-MM-dd HH:mm:ss”
         * @return 返回根据给定格式的字符串表示的时间日期格式<br>
         *         如果传入不合法的格式，则返回日期的字符串格式{@see Date#toLocaleString()}
         */
        formatCurrentDate: function(strFormat){
            try{
                var tempFormat = strFormat == undefined? this.DEFAULT_DATETIME_FORMAT: strFormat;
                var dates = this.getDateObject(this.curDate);
                if(/(y+)/.test(tempFormat)){
                    var fullYear = this.curDate.getFullYear() + '';
                    var year = RegExp.$1.length == 4? fullYear: fullYear.substr(4 - RegExp.$1.length);
                    tempFormat = tempFormat.replace(RegExp.$1, year);
                }
                for(var i in dates){
                    if(new RegExp('(' + i + ')').test(tempFormat)){
                        var target = RegExp.$1.length == 1? dates[i]: ('0' + dates[i]).substr(('' + dates[i]).length - 1);
                        tempFormat = tempFormat.replace(RegExp.$1, target);
                    }
                }
                return tempFormat === strFormat? this.curDate.toLocaleString(): tempFormat;
            }catch(e){
                this.debug('格式化日期出现异常：' + e.message);
            }
        },


        /**
         * 根据给定的格式，把给定的时间进行格式化
         * @params date 要格式化的日期
         * @params strFormat 要得到的日期的格式的格式化字符串，如：'yyyy-MM-dd'，默认：yyyy-MM-dd HH:mm:ss
         * @return 根据规定格式的时间格式
         *
         * @updateDate 2011-09-15
         */
        format: function(date, strFormat){
            try{
                if(date == undefined){
                    this.curDate = new Date();
                }else if(!(date instanceof Date)){
                    this.debug('你输入的date:' + date + '不是日期类型');
                    return date;
                }else{
                    this.curDate = date;
                }
                return this.formatCurrentDate(strFormat);
            }catch(e){
                this.debug('格式化日期出现异常：' + e.message);
            }
        },

        /**
         * 根据给定的格式对给定的字符串日期时间进行解析，
         * @params strDate 要解析的日期的字符串表示,此参数只能是字符串形式的日期，否则返回当期系统日期
         * @params strFormat 解析给定日期的顺序, 如果输入的strDate的格式为{Date.parse()}方法支持的格式，<br>
         *         则可以不传入，否则一定要传入与strDate对应的格式, 若不传入格式则返回当期系统日期。
         * @return 返回解析后的Date类型的时间<br>
         *        若不能解析则返回当前日期<br>
         *        若给定为时间格式 则返回的日期为 1970年1月1日的日期
         *
         * bug: 此方法目前只能实现类似'yyyy-MM-dd'格式的日期的转换，<br>
         *       而'yyyyMMdd'形式的日期，则不能实现
         */

        parseDate: function(strDate, strFormat){
            if(typeof strDate != 'string'){
                return new Date();
            }
            var longTime = Date.parse(strDate);
            if(isNaN(longTime)){
                if(strFormat == undefined){
                    this.debug('请输入日期的格式');
                    return new Date();
                }
                var tmpDate = new Date();
                var regFormat = /(\w{4})|(\w{2})|(\w{1})/g;
                var regDate = /(\d{4})|(\d{2})|(\d{1})/g;
                var formats = strFormat.match(regFormat);
                var dates = strDate.match(regDate);
                if( formats != undefined &&  dates != undefined && formats.length == dates.length){
                    for(var i = 0; i < formats.length; i++){
                        var format = formats[i];
                        if(format === 'yyyy'){
                            tmpDate.setFullYear(parseInt(dates[i], 10));
                        }else if(format == 'yy'){
                            var prefix = (tmpDate.getFullYear() + '').substring(0, 2);
                            var year = (parseInt(dates[i], 10) + '').length == 4? parseInt(dates[i], 10): prefix + (parseInt(dates[i], 10) + '00').substring(0, 2);
                            var tmpYear = parseInt(year, 10);
                            tmpDate.setFullYear(tmpYear);
                        }else if(format == 'MM' || format == 'M'){
                            tmpDate.setMonth(parseInt(dates[i], 10) - 1);
                        }else if(format == 'dd' || format == 'd'){
                            tmpDate.setDate(parseInt(dates[i], 10));
                        }else if(format == 'HH' || format == 'H'){
                            tmpDate.setHours(parseInt(dates[i], 10));
                        }else if(format == 'mm' || format == 'm'){
                            tmpDate.setMinutes(parseInt(dates[i], 10));
                        }else if(format == 'ss' || format == 's'){
                            tmpDate.setSeconds(parseInt(dates[i], 10));
                        }
                    }
                    return tmpDate;
                }
                return tmpDate;
            }else{
                return new Date(longTime);
            }
        },


        /**
         * 根据给定的时间间隔类型及间隔值，以给定的格式对给定的时间进行计算并格式化返回
         * @params date 要操作的日期时间可以为时间的字符串或者{@see Date}类似的时间对象，
         * @params interval 时间间隔类型如："YEAR"、"MONTH"、 "DATE", 不区分大小写
         * @params amount 时间间隔值，可以正数和负数, 负数为在date的日期减去相应的数值，正数为在date的日期上加上相应的数值
         * @params strFormat 当输入端的date的格式为字符串是，此项必须输入。若date参数为{@see Date}类型是此项会作为最终输出的格式。
         * @params targetFormat 最终输出的日期时间的格式，若没有输入则使用strFormat或者默认格式'yyyy-MM-dd HH:mm:ss'
         * @return 返回计算并格式化后的时间的字符串
         */
        changeDate: function(date, interval, amount, strFormat, targetFormat){
            var tmpdate = new Date();
            if(date == undefined){
                this.debug('输入的时间不能为空!');
                return new Date();
            }else if(typeof date == 'string'){
                tmpdate = this.parseDate(date, strFormat);
            }else if(date instanceof Date){
                tmpdate = date;
            }
            var field  =  (typeof interval == 'string')? interval.toUpperCase(): 'DATE';

            try{
                amount = parseInt(amount + '', 10);
                if(isNaN(amount)){
                    amount = 0;
                }
            }catch(e){
                this.debug('你输入的[amount=' + amount + ']不能转换为整数');
                amount = 0;
            }
            switch(field){
                case this.DEFAULT_YEAR:
                    tmpdate.setFullYear(tmpdate.getFullYear() + amount);
                    break;
                case this.DEFAULT_MONTH:
                    tmpdate.setMonth(tmpdate.getMonth() + amount);
                    break;
                case this.DEFAULT_DATE:
                    tmpdate.setDate(tmpdate.getDate() + amount);
                    break;
                case this.DEFAULT_HOUR:
                    tmpdate.setHours(tmpdate.getHours() + amount);
                    break;
                case this.DEFAULT_MINUTE:
                    tmpdate.setMinutes(tmpdate.getMinutes() + amount);
                    break;
                case this.DEFAULT_SECOND:
                    tmpdate.setSeconds(tmpdate.getSeconds() + amount);
                    break;
                default:
                    this.debug('你输入的[interval:' + field + '] 不符合条件!');
            }

            this.curDate = tmpdate;
            return this.formatCurrentDate(targetFormat == undefined? strFormat: targetFormat);
        },
        /**
         * 根据给定的时间间隔类型及间隔值，以给定的格式对给定的时间进行计算并格式化返回
         * @params date 要操作的日期时间可以为时间的字符串或者{@see Date}类似的时间对象，
         * @params amount 时间间隔值，可以正数和负数, 负数为在date的日期减去相应的数值，正数为在date的日期上加上相应的数值
         * @params strFormat 当输入端的date的格式为字符串是，此项必须输入。若date参数为{@see Date}类型是此项会作为最终输出的格式。
         * @params targetFormat 最终输出的日期时间的格式，若没有输入则使用strFormat或者默认格式'yyyy-MM-dd HH:mm:ss'
         * @return 返回计算并格式化后的时间的字符串
         */
        addDays: function(date, amount, strFormat, targetFormat){
            return this.changeDate(date,this.DEFAULT_DATE,amount,strFormat,targetFormat);
        },
        /**
         * 比较两个日期的差距
         * @param date1 Date类型的时间
         * @param date2 Dete 类型的时间
         * @param isFormat boolean 是否对得出的时间进行格式化,<br>
         *       false:返回毫秒数，true：返回格式化后的数据
         * @return 返回两个日期之间的毫秒数 或者是格式化后的结果
         */
        compareTo: function(date1, date2, isFormat){
            try{
                var len = arguments.length;
                var tmpdate1 = new Date();
                var tmpdate2 = new Date();
                if(len == 1){
                    tmpdate1 = date1;
                }else if(len >= 2){
                    tmpdate1 = date1;
                    tmpdate2 = date2;
                }
                if(!(tmpdate1 instanceof Date) || !(tmpdate2 instanceof Date)){
                    return 0;
                }else{
                    var time1 = tmpdate1.getTime();
                    var time2 = tmpdate2.getTime();
                    var time = Math.max(time1, time2) - Math.min(time1, time2);
                    if(!isNaN(time) && time > 0){
                        if(isFormat){
                            var date = new Date(time);
                            var result = {};
                            result['year']   = (date.getFullYear() - 1970) > 0? (date.getFullYear() - 1970): '0';
                            result['month']  = (date.getMonth() - 1) > 0? (date.getMonth() - 1): '0';
                            result['day']    = (date.getDate() - 1) > 0? (date.getDate() - 1): '0';
                            result['hour']   = (date.getHours() - 8) > 0? (date.getHours() - 1): '0';
                            result['minute'] = date.getMinutes() > 0? date.getMinutes(): '0';
                            result['second'] = date.getSeconds() > 0? date.getSeconds(): '0';
                            return result;
                        }else {
                            return time;
                        }
                    }else{
                        return 0;
                    }
                }
            }catch(e){
                this.debug('比较时间出现异常' + e.message);
            }
        },

        /**
         * 根据给定的日期得到日期的月，日，时，分和秒的对象
         * @params date 给定的日期 date为非Date类型， 则获取当前日期
         * @return 有给定日期的月、日、时、分和秒组成的对象
         */
        getDateObject: function(date){
            if(!(date instanceof Date)){
                date = new Date();
            }
            return {
                'M+' : date.getMonth() + 1,
                'd+' : date.getDate(),
                'H+' : date.getHours(),
                'm+' : date.getMinutes(),
                's+' : date.getSeconds()
            };
        },

        /**
         *在控制台输出日志
         *@params message 要输出的日志信息
         */
        debug: function(message){
            try{
                if(!this.isDebug){
                    return;
                }
                if(!window.console){
                    window.console = {};
                    window.console.log = function(){
                        return;
                    }
                }
                window.console.log(message + ' ');
            }catch(e){
            }
        }
    }
   
