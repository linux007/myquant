// botvs@8c28d00fbca70567e16fd3836d3e7e97
/*backtest
start: 2017-09-10 00:00:00
end: 2017-11-15 00:00:00
period: 15m
*/

function main() {
    $.CTA(Symbols, function(st) {
        var records = st.records
        var mp = st.position.amount
        var hold = st.position.price
        var symbol = st.symbol
        var ticker = _C(exchange.GetTicker)

        if (records.length < 50) {
            return
        }

        var previous_bar = records[records.length-2]
        var current_bar = records[records.length-1]
        
        // 均线交叉
        var ma5s = TA.MA(records, 5)
        var ma10s = TA.MA(records, 10)
        var ma20s = TA.MA(records, 20)

        var previous_ma20 = ma20s[ma20s.length-2]
        var previous_ma10 = ma10s[ma10s.length-2]
        var previous_ma5 = ma5s[ma5s.length-2]
        var current_ma20 = ma20s[ma20s.length-1]
        var current_ma10 = ma10s[ma10s.length-1]
        var current_ma5 = ma5s[ma5s.length-1]
        
        var ma_cross = $.Cross(ma5s, ma10s)

        // cci
        var cci = talib.CCI(records, cci_windows)
        var previous_cci = cci[cci.length-2]
        var current_cci = cci[cci.length-1]

        // macd
        // 9, 13, 9
        var macd = TA.MACD(records)
        // var macd = TA.MACD(records)
        var dif = macd[0]
        var dea = macd[1]
        var his = macd[2]
        var previous_dif = _N(dif[dif.length-2], 2)
        var current_dif = _N(dif[dif.length-1],2)
        var previous_dea = _N(dea[dea.length-2],2)
        var current_dea = _N(dea[dea.length-1],2)
        var previous_macd = _N(his[his.length-2],2)
        var current_macd = _N(his[his.length-1],2)
        var macd_cross = $.Cross(dif, dea)

        //ATR
        var atr = TA.ATR(records, atr_windows)
        var current_atr = atr[atr.length-1]
        var previous_atr = atr[atr.length-2]

        var rsi = TA.RSI(records)
        var previous_rsi = rsi[rsi.length-2]
        var current_rsi = rsi[rsi.length-1]


        var KDJ = TA.KDJ(records, 18, 3, 3)
        var K = KDJ[0]
        var D = KDJ[1]
        var J = KDJ[2]
        var current_K = K[K.length-1]
        var current_D = D[D.length-1]
        var current_J = J[J.length-1]
        var kdj_cross = $.Cross(K, D)

        // rsi
        var rsi = TA.RSI(records,14)
        var rsi14 = TA.RSI(records, 14)
        var previous_rsi = rsi[rsi.length-2]
        var current_rsi = rsi[rsi.length-1]
        var rsi_cross = $.Cross(rsi, rsi14)

        // Log('openTimes=', _G(symbol+'_opentimes'), 'hold=', hold, 'ticker_price=', ticker.Last)
        // Log(ma_cross, '|ticker=', ticker.Last, 'pre_cci:cur_cci=', previous_cci, ':', current_cci)
        // Log('macd:: cross=', macd_cross, 'dif=', current_dif, 'dea=', current_dea)

        
        // 开空
        if (mp === 0 && macd_cross >= -3  && ma_cross >= -3 && ma_cross < 0 && current_macd < 0 && (previous_bar.Close < previous_ma5)) {

            if ((previous_cci > current_cci) && current_cci < 0 && current_J > 20) {
                if (previous_ma20 > current_ma20) {
                    Log('macd_cross=', macd_cross, ' premacd:curmacd=', previous_macd, ':', current_macd, ' predif:curdif=', previous_dif, ':', current_dif, ' dea=', previous_dea, ':',current_dea)
                    Log('ma_cross=', ma_cross, ' close:ma20=', previous_bar.Close, ':', previous_ma5)
                    Log('prema20:curma20=', previous_ma20, ':', current_ma20)
                    Log('ma5:ma10:ma20=', current_ma5, ':', current_ma10, ':', current_ma20)
                    Log('precci:curcci=', previous_cci, ':', current_cci, 'rsi=', current_rsi, 'kdj=', current_K, ':', current_D, ':', current_J, ' kdj_cross=', kdj_cross)
                    return -Lots
                }
            }
        }

        // 持空
        if (mp < 0) {
            if (ticker.Last < _N(hold - 3.618 * previous_atr, 0)) {
                Log('触发止盈机制')
                return 0
            }

            // 止损
            if (ticker.Last > _N(hold + 1.3 * previous_atr, 0)) {
                Log('空单止损::开仓价=', hold, '止损位=', ticker.Last)
                return 0
            }
        }
        
      	/*
        // 开多
        if (mp === 0) {
            // previous_ma5 < current_ma5 && previous_ma10 < current_ma10 && 
            // previous_ma10 > previous_ma5 && current_ma5 > current_ma10
            // (macd_cross > 0 && previous_ma10 > previous_ma5 && current_ma5 > current_ma10
            if (macd_cross > 0 && previous_ma10 > previous_ma5 && current_ma5 > current_ma10) {

                if (previous_cci < 100 && previous_cci < current_cci && current_ma5 > current_ma10 && current_ma10 > current_ma20) {
                    var delay_time = new Date().getTime() + 9 * 60 * 1000
                    var open_price = ticker.Last - 8
                    Log(symbol + ' 开多 ', ticker.Last)
                    // 在10分周期内找出一个好的点位
                    while (new Date().getTime() < delay_time) {
                        var ticker_temp = _C(exchange.GetTicker)
                        // Log('当前价格=', ticker_temp.Last)
                        if (ticker_temp.Last <= open_price) {
                            var cci_ma = TA.MA(cci, 28)
                            var current_cci_ma = cci_ma[cci_ma.length-1]
                            Log('macd_cross=', macd_cross, ' premacd:curmacd=', previous_macd, ':', current_macd, ' predif:curdif=', previous_dif, ':', current_dif, ' dea=', previous_dea, ':',current_dea)
                            // Log('ma_cross=', ma_cross, ' close:ma20=', previous_bar.Close, ':', previous_ma5)
                            Log('rsi_cross=', rsi_cross, '开仓价格=', ticker.Last)
                            Log('prersi:currsi=', previous_rsi, ':', current_rsi, 'cci_ma=', current_cci_ma)
                            Log('prema20:curma20=', previous_ma20, ':', current_ma20)
                            Log('prema10:curma10=', previous_ma10, ':', current_ma10)
                            Log('prema5:curma5=', previous_ma5, ':', current_ma5)
                            Log('ma5:ma10:ma20=', current_ma5, ':', current_ma10, ':', current_ma20)
                            Log('precci:curcci=', previous_cci, ':', current_cci, 'rsi=', current_rsi, 'kdj=', current_K, ':', current_D, ':', current_J, ' kdj_cross=', kdj_cross)
                            return Lots
                        }
                    }

                    return Lots
                    
                }
            }
        }

        //持多
        if (mp > 0) {
            
            //////////////////////////////////////////////////////////////////////////////
            //特殊转向也分向上转向和向下转向两种。若当日最高价高于前一日的最高价，且最低价低于前一日的最低价，而收盘价高于上一日收盘价，便构成特殊向上转向信号。 //
            //反之，若当日最高价低于上日最高价，且最低价高于上一日的最低价，而收盘价低于上一日收盘价，便构成特殊向下转向信号。
            //////////////////////////////////////////////////////////////////////////////
            var ma5_records = exchange.GetRecords(PERIOD_M5)
            var previous_ma5_bar = ma5_records[ma5_records.length-2]
            var current_ma5_bar = ma5_records[ma5_records.length-1]

            var ma5_cci = talib.CCI(ma5_records, cci_windows)
            var previous_ma5_cci = ma5_cci[ma5_cci.length-2]
            var current_ma5_cci = ma5_cci[ma5_cci.length-1]

            var ma5_records = exchange.GetRecords(PERIOD_M30)
            var KDJ = TA.KDJ(ma5_records, 9, 3, 3)
            var K = KDJ[0]
            var D = KDJ[1]
            var J = KDJ[2]
            var current_K = K[K.length-1]
            var current_D = D[D.length-1]
            var current_J = J[J.length-1]

            if (ticker.Last > hold && current_ma5_bar.High < previous_ma5_bar.High && current_ma5_bar.Low > previous_ma5_bar.Low && current_ma5_bar.Close <= previous_ma5_bar.Close) {
                // Log('previous_ma5_cci=', previous_ma5_cci, 'current_ma5_cci=', current_ma5_cci)
                if (previous_ma5_cci > 180 && previous_ma5_cci > current_ma5_cci && current_D > 70) {
                    Log('kdj=', current_K, ':', current_D, ':', current_J)
                    // Log('ma5 bar=', current_ma5_bar)
                    return 0
                }
            }

            // Log('KDJ=', current_D, ':', current_J, 'price=', ticker.Last, 'low=', current_bar.Low, 'close=', current_bar.Close)
            // 止损
            if (ticker.Last < _N(hold - 1.3 * previous_atr, 0)) {
                Log('多单止损::开仓价=', hold, '止损位=', ticker.Last)
                return 0
            }
        }
        */

    })
}