/*backtest
start: 2017-09-27 00:00:00
end: 2017-10-28 00:00:00
period: 15m
*/
function main() {
    // 使用了商品期货类库的CTA策略框架
    $.CTA(Symbols, function(r, mp, symbol, holdPrice) {

        if (r.length < 22) {
            return
        }
        
        var amount = Lots
        var close = []  //收盘价
        
        var cci = talib.CCI(r, cci_windows)
        
        var insDetail = _C(exchange.SetContractType, symbol)
        var ticker = _C(exchange.GetTicker)
        var revious_bar = r[r.length - 2]
        var current_bar = r[r.length - 1]
        
        //计算时间周期
        var global_period = current_bar.Time - revious_bar.Time
        //Log('运行时间周期:', global_period)
        
        
        _.each(r, function(item) {
            close.push(item.Close)
        })
 
        var KDJ = TA.KDJ(r)
        var K_List = KDJ[0]
        var D_List = KDJ[1]
        var J_List = KDJ[2]
        var K = K_List[K_List.length - 1]
        var D = D_List[D_List.length - 1]
        var J = J_List[J_List.length - 1]
        var previous_k_value = K_List[K_List.length - 2]
        var previous_d_value = D_List[D_List.length - 2]
        
        //ATR
        var atr = TA.ATR(r, atr_windows)
        Log('atr:', atr[atr.length-1])
        
        
        // 量能潮
        var obv = TA.OBV(r)
           
        //sar
        var sar_trend = 0
        var sar = talib.SAR(r, SAR_AF)
        var current_sar = sar[sar.length-1]
        // sar 空头
        if (ticker.Last < current_sar) {
            sar_trend = 1
        }
        // sar 多头
        if (ticker.Last > current_sar) {
            sar_trend = 2 
        }
        
        //macd
        var macd = TA.MACD(r, 8, 13, 9)
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
        if ((current_macd < 0) && (current_dif < 0) && (current_dea < 0) && ((previous_dif > current_dif) || (previous_dea > current_dea))) {
            macd_trend = 1
        }

        //macd 强势多头
        if ((current_macd > 0) && (current_dif > 0) && (current_dea > 0) && ((previous_dif < current_dif) || (previous_dea < current_dea))) {
            macd_trend = 2
        }

        // macd 弱势  多单适当减仓
        if ((current_macd > 0) && ((previous_dif > current_dif) && (previous_dea > current_dea))) {
            macd_trend = 3
        }
        
        // macd 强势
        if ((previous_dif < current_dif) && (previous_dea < current_dea)) {
            macd_trend = 4
        }
        
        // 判断当前有没有持仓, 判断止盈止损
        // 持多单
        if(mp > 0) {
          
        }
        // 持空单
        if (mp < 0) {
            
        }
     
        // 沽多
        if ((cci[cci.length-2] <= -100 && cci[cci.length-1] > -100) || (cci[cci.length-2] <= 100 && cci[cci.length-1] > 100)) {
            Log('多单')
            Log('cci::previous:current=', cci[cci.length-2], ':', cci[cci.length-1])
            
            return amount 
        }
        // 沽空
        if ((cci[cci.length-1] < 100 && cci[cci.length-2] >= 100) || (cci[cci.length-1] < -100 && cci[cci.length-2] > -100)) {
            Log('空单')
            Log('cci::previous:current=', cci[cci.length-2], ':', cci[cci.length-1])
            return -amount
        }

    });
}