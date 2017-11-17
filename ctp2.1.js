// botvs@5b331d9a61baea5e450c473d1086d71f
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

        // Log('openTimes=', _G(symbol+'_opentimes'), 'hold=', hold, 'ticker_price=', ticker.Last)
        // Log(ma_cross, '|ticker=', ticker.Last, 'pre_cci:cur_cci=', previous_cci, ':', current_cci)
        // Log('macd:: cross=', macd_cross, 'dif=', current_dif, 'dea=', current_dea)

        // 开空
        if (mp === 0 && macd_cross >= -3  && ma_cross >= -3 && ma_cross < 0 && current_macd < 0 && (previous_bar.Close < previous_ma5)) {

        	if ((previous_cci > current_cci) && current_cci < 0 && current_J > 20) {
        		if (previous_ma20 > current_ma20) {
        		// if (current_dif < 0 && current_dif > -10 && current_dea > -10) {
        			Log('macd_cross=', macd_cross, ' premacd:curmacd=', previous_macd, ':', current_macd, ' predif:curdif=', previous_dif, ':', current_dif, ' dea=', previous_dea, ':',current_dea)
	    			Log('ma_cross=', ma_cross, ' close:ma20=', previous_bar.Close, ':', previous_ma5)
	    			Log('prema20:curma20=', previous_ma20, ':', current_ma20)
	    			Log('ma5:ma10:ma20=', current_ma5, ':', current_ma10, ':', current_ma20)
	    			Log('precci:curcci=', previous_cci, ':', current_cci, 'rsi=', current_rsi, 'kdj=', current_K, ':', current_D, ':', current_J, ' kdj_cross=', kdj_cross)
	        		return -Lots
        		// }
        		}
        	}
        	
        	// if (ma_cross < 0 && (previous_bar.Close < previous_ma20) && (current_ma10 < current_ma20)) {
        		
        	// 	if (previous_cci > -100 && current_cci < -100) {
        	// 		Log('macd_cross=', macd_cross, ' macd=', current_macd)
        	// 		Log('ma_cross=', ma_cross, ' close:ma20=', previous_bar.Close, ':', previous_ma20)
        	// 		Log('precci:curcci=', previous_cci, ':', current_cci)
	        // 		return -Lots
	        // 	}
        	// }
        }

        // 持空
        if (mp < 0) {
        	// 空单加仓
        	// if (ma_cross < 0 && _G(symbol+'_opentimes') < 1) {
        	// 	_G(symbol+'_opentimes', 1)
        	// 	return -Lots * 2
        	// }
        	
       //  	if (kdj_cross > 0) {
       //  		Log('触发止盈机制')
    			// return 0
       //  	}
       //  	
	       	if (ticker.Last < _N(hold - 3.618 * previous_atr, 0)) {
	    		Log('触发止盈机制')
				return 0
	    	}
       		

        	/*
        	// 触发止盈机制
        	var symbol_min = _G(symbol+'_min')
        	if (!symbol_min && ticker.Last < _N(hold - 2.618 * previous_atr, 0)) {
        		Log('触发止盈机制')
        		_G(symbol+'_min', ticker.Last)
    			_G(symbol+'_moving_sell_pos', ticker.Last + 0.8 * previous_atr)

    			_G(symbol+'_opentimes', 0)
                _G(symbol+'_min', 0)
                _G(symbol+'_moving_sell_pos', 0)
    			return 0
        	}

        	//移动止损
        	// 自开空单最小点位，（及目前最大盈利)
        	// symbol_min = _G(symbol+'_min')
        	var moving_close_sell_position = _G(symbol+'_moving_sell_pos')
        	if (symbol_min) {
        		// 如果有更低点，进行更新
        		if (ticker.Last < symbol_min) {
        			Log('更新止损位=', ticker.Last + 0.8 * previous_atr, 'min=', ticker.Last)
        			// Log('macd_cross=', macd_cross, ' macd=', current_macd)
        			// Log('ma_cross=', ma_cross, ' close:ma20=', previous_bar.Close, ':', previous_ma20)
        			// Log('precci:curcci=', previous_cci, ':', current_cci)
        			_G(symbol+'_min', ticker.Last)
        			// 移动止损固定15个点
        			_G(symbol+'_moving_sell_pos', ticker.Last + 0.8 * previous_atr)
        		}
        	}

            moving_close_sell_position = _G(symbol+'_moving_sell_pos')
            // Log('Last=', ticker.Last)
            if (moving_close_sell_position && (ticker.Last >= moving_close_sell_position)){
                Log('移动平仓')
                Log('移动止损位=', moving_close_sell_position, ' premacd:cur_macd=', previous_macd, ':', current_macd, ' close:ma=', current_bar.Close, ':', current_ma5, 'price=', ticker.Last)
                _G(symbol+'_opentimes', 0)
                _G(symbol+'_min', 0)
                _G(symbol+'_moving_sell_pos', 0)
                return 0
            }

        	// 最大止盈
        	var close_sell_position = _N(hold - 2.618 * previous_atr, 0)
        	if (ticker.Last < close_sell_position) {
        		_G(symbol+'_opentimes', 0)
        		_G(symbol+'_min', 0)
                _G(symbol+'_moving_sell_pos', 0)
                Log('触发最大止盈::止盈点位=',close_sell_position, '当前价格=', ticker.Last)
                return 0
        	}
        	*/

        	// 止损
        	if (ticker.Last > _N(hold + 1.3 * previous_atr, 0)) {
        		_G(symbol+'_opentimes', 0)
        		_G(symbol+'_min', 0)
                _G(symbol+'_moving_sell_pos', 0)
        		Log('空单止损::开仓价=', hold, '止损位=', ticker.Last)
                return 0
        	}
        }



    })
}