// botvs@d5e00dd2f1a73db8011afc3f8e584de3
/*backtest
start: 2017-09-27 00:00:00
end: 2017-10-24 00:00:00
period: 15m
*/
function main() {
    // 使用了商品期货类库的CTA策略框架
    $.CTA(Symbols, function(r, mp, symbol, holdPrice) {
        /*
        r为K线, mp为当前品种持仓数量, 正数指多仓, 负数指空仓, 0则不持仓, symbol指品种名称
        返回值如为n: 
            n = 0 : 指全部平仓(不管当前持多持空)
            n > 0 : 如果当前持多仓，则加n个多仓, 如果当前为空仓则平n个空仓
            n < 0 : 如果当前持空仓，则加n个空仓, 如果当前为多仓则平n个多仓
            无返回值表示什么也不做
        */
        if (r.length < 22) {
            return
        }
        //$.PlotRecords(r, symbol)
        
        var cci = talib.CCI(r, CCIPeriod)
        
        var insDetail = _C(exchange.SetContractType, symbol)
        var ticker = _C(exchange.GetTicker)
        var revious_bar = r[r.length - 2]
        var current_bar = r[r.length - 1]
        var atr = TA.ATR(r, AtrPeriod)
        
        //计算时间周期
        var global_period = current_bar.Time - revious_bar.Time
        //Log('运行时间周期:', global_period)
        
        //计算BIAS （N期BIAS=(当日收盘价-N期平均收盘价)/N期平均收盘价*100%）
        var barClosePrice = []
        var biasArr = []
        var biasSum = 0
        var avgClose = 0
        var biasPeriodSum = 0
        
        _.each(r, function(item) {
            barClosePrice.push(item.Close)
        })
        /*
        for (var i=0; i<=nPeriod; i++) {
            var SliceBar = barClosePrice.slice(-(BiasPeriod + i), barClosePrice.length-i)
            //Log('SliceBar', SliceBar)
            var biasSum = 0
            _.each(SliceBar, function(num) {
                biasSum += num
            })
            avgClose = _N(biasSum/SliceBar.length, 0)
            var current_bar_close = SliceBar[SliceBar.length - (i+1)]
            var bias_item = _N((current_bar_close - avgClose)/avgClose * 100, 2)
            // 求前nPeriod的bias和
            if (i > 0) {
                biasPeriodSum += bias_item
            }
            biasArr.push(bias_item)
        }*/
        
        var SliceBar = barClosePrice.slice(-BiasPeriod)
        //Log('allClose:', barClosePrice)
        //Log('barClosePrice:', AvgBias)
        //Log('biasArr:', biasArr)
        
        _.each(SliceBar, function(num) {
            biasSum += num
        })
        avgClose = _N(biasSum/SliceBar.length, 0)
        var bias = _N((current_bar.Close - avgClose)/avgClose * 100, 2)
        
        //var avgBias = _N(biasPeriodSum/nPeriod, 2)
        //var bias = biasArr[0]
        //Log('当前bias:', bias, '平均bias:', avgBias * avgBiasRatio)
        //Log('Bias:', biasArr, '当前价格', ticker.Last)
    
        var KDJ = TA.KDJ(r)
        var K_List = KDJ[0]
        var D_List = KDJ[1]
        var J_List = KDJ[2]
        var K = K_List[K_List.length - 1]
        var D = D_List[D_List.length - 1]
        var J = J_List[J_List.length - 1]
        var previous_k_value = K_List[K_List.length - 2]
        var previous_d_value = D_List[D_List.length - 2]
        
        // 量能潮
        var close = []
        _.each(r, function(item) {
            close.push(item.Close)
        })
        var roc = talib.ROC(close, RocPeriod)
        //Log('roc:', roc)
        var previous_maroc = roc[roc.length-2]
        var current_maroc = roc[roc.length-1]
        
        //macd
        var macd = TA.MACD(r, 12, 26, 9)
        var dif = macd[0]
        var dea = macd[1]
        var his = macd[2]
        var previous_dif = dif[dif.length-2]
        var current_dif = dif[dif.length-1]
        var previous_dea = dea[dea.length-2]
        var current_dea = dea[dea.length-1]
        var previous_macd = his[his.length-2]
        var current_macd = his[his.length-1]
        
        //macd 空头趋势
        var macd_trend = 0

        //macd 多头趋势
        if ((current_macd > 0) && ((previous_dif < current_dif) || (previous_dea < current_dea))) {
            macd_trend = 2
        }
        
        //macd 由弱转强  (止盈止损)
        if (previous_macd < current_macd) {
            macd_trend = 3
        }
         
        // 判断当前有没有持仓, 判断止盈止损
        // 持多单
        if(mp > 0) {
           var highest = TA.Highest(r, AtrPeriod, 'High')
           // 做多止损  (吊灯止损)
           /*
           var LongLoss = _N(highest - atr[atr.length - 1] * AtrConstant, 0)
           if (ticker.Last <= LongLoss) {
               Log('做多止损:', LongLoss, '当前价格:', ticker.Last)
               return 0
           }
           */
           //止盈平仓
           var LongWinKey = symbol + '_longWin'
           if ( !_G(LongWinKey) ) {
               var LongWin = _N(r[r.length - 2].Close + atr[atr.length - 1] * 2, 0)
              // Log('止盈位:', LongWin)
               _G(LongWinKey, LongWin)
           }
           // 止盈条件  kdj  bias
           // 1. 确认超买区：D>80 或 J>100时。
           // 2. kd 死叉
           // 3. bias 乖离值转折
           var CloseBuySignal = false
           
           if ((D >= 80)) {
               Log('D:', D, 'J:', J, 'bias:', bias, '当前价格:', ticker.Last)
               CloseBuySignal = true
           }
           
           // macd 趋势止盈 macd 转头向下
           /*
           if (previous_macd > current_macd) {
               Log('macd止盈:', '上一个macd:', previous_macd, '当前macd:', current_macd)
               CloseBuySignal = true
           }*/
           // K线从上向下穿过D线
           var kdj_closebuy_signal = false
           if ( previous_k_value > previous_d_value && K < D ) {
               kdj_closebuy_signal = true
           }
            
           if (D >= 70 && kdj_closebuy_signal) {
               Log('多单止盈，kdj 死叉')
               CloseBuySignal = true
           }
           
           // 抢反弹，看压力位止盈
           /*
           if (_G('biasLong')) {
               if (bias > -0.1) {
                   if (previous_macd < current_macd) return
                   _G('biasLong', null)
                   Log('bias 压力止盈:', bias)
                   return 0
               }
           }*/
           //快速止盈  bias 转折
            
           if (CloseBuySignal) {
               Log('多单止盈:','开仓价=', holdPrice)
               return 0
           }   
        }
        // 持空单
        if (mp < 0) {
            var lowest = TA.Lowest(r, AtrPeriod, 'Low')
            //做空止损
            
            var shortLosss = _N(lowest + atr[atr.length - 1] * AtrConstant, 0)
            if (ticker.Last >= shortLosss) {
               Log('当前价格:', ticker.Last)
               Log('做空止损:', shortLosss, '当前价格:', ticker.Last)
               return 0
           }
           
           //平仓止盈
           var ShortWinKey = symbol + '_shortWin'
           if ( !_G(ShortWinKey) ) {
               var ShortWin = _N(r[r.length - 2].Close - atr[atr.length - 1] * 2, 0)
               //Log('止盈位:', ShortWin)
               _G(ShortWinKey, ShortWin)
           }
           // 止盈条件  kdj  bias
           // 1. 确认超卖区：D<=22 或 J<20时。
           // 2. kd 金叉
           // 3. bias <= BiasShortThreshold
           var CloseSellSignal = false
           if (D < 20) {
               Log('KDJ止盈：', 'D:', D, 'J:', J)
               CloseSellSignal = true
           }
           // K线从下向上穿过D线
           /*
           if ( previous_k_value < previous_d_value && K > D ) {
               Log('kdj 金叉')
               CloseSellSignal = true
           }
           */
           /*
           if (bias <= BiasShortThreshold) {
               Log('bias 平仓信号')
               CloseSellSignal = true
           }*/
           if (CloseSellSignal) {
               Log('空单止盈:', '开仓价=', holdPrice)
               return 0
           }
        }
     
        // 沽多
        if ((cci[cci.length-2] <= -100 && cci[cci.length-1] > -100) || (cci[cci.length-2] <= 100 && cci[cci.length-1] > 100)) {
            if (Math.abs(mp) > 0) return
            Log('开多仓条件:', cci[cci.length-2], '==>', cci[cci.length-1], '当前价格:', ticker.Sell, ticker.Buy, ticker.Last, 'KDJ', K,':',D,':',J)
            
            Log('p_dif:c_dif', previous_dif, ':', current_dif, 'p_dea:c_dea', previous_dea, ':', current_dea, 'macd:', current_macd)
            if ((current_macd < 0) && (previous_dif>current_dif) || (previous_dea>current_dea)) {
                macd_trend = 1
            }
            //判断macd 趋势
            if (macd_trend == 1) {
                Log('macd趋势空头，谨慎做多')
                return
            }
            // 同一个bar周期只开一单
            /*
            if ( _G('startLongTime') && _G('startLongTime') + global_period >= new Date().getTime() ) {
                return 
            }*/
            // kdj钝化
            if (D > 80) {
                return
            }
            // 判断量能是否背离
            //if (previous_maroc > current_maroc) return
            
            // 1. sar 趋势对不对 2. kdj 有一个不符合就过滤 (d,j)
            //Log('previous_roc:', previous_maroc, 'current_maroc:', current_maroc)
            _G('startLongTime', current_bar.Time)
            // 逆势开多单，枪反弹
            if (bias < 0) {
                _G('biasLong', true)
            }
            return Lots 
        }
        // 沽空
        if ((cci[cci.length-1] < 100 && cci[cci.length-2] >= 100) || (cci[cci.length-1] < -100 && cci[cci.length-2] > -100)) {
            if (Math.abs(mp) > 0) return
            Log('开空仓条件:', cci[cci.length-2], '==>', cci[cci.length-1], '当前价格:', ticker.Sell, ticker.Buy, ticker.Last, 'KDJ:', K,':',D,':',J)
            // 同一个bar周期只开一单
            /*
            if ( _G('startLongTime') && _G('startLongTime') + global_period >= new Date().getTime() ) {
                return 
            }*/
            
             //判断macd 趋势
            if (macd_trend == 2) {
                Log('macd趋势多头，谨慎做空')
                return
            }
            
            // kdj钝化
            if (D < 30) {
                return
            }
            _G('startLongTime', current_bar.Time)
            return -Lots
        }

    });
}