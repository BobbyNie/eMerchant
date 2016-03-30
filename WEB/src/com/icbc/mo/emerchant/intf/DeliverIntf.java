package com.icbc.mo.emerchant.intf;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import com.icbc.IcbcUtil;
import com.icbc.mo.emerchant.deliver.HsTrDeliverCount;
import com.icbc.mo.emerchant.deliver.HsTrDelivery;
import com.icbc.mo.emerchant.deliver.controller.HsTrDeliverCountManager;
import com.icbc.mo.emerchant.deliver.controller.HsTrDeliveryManager;
import com.icbc.mo.emerchant.order.HsTrMasterOrder;
import com.icbc.mo.emerchant.order.HsTrOrderFlow;
import com.icbc.mo.emerchant.order.controller.HsTrMasterOrderManager;
import com.icbc.mo.emerchant.order.controller.HsTrOrderFlowManager;
import com.icbc.mo.emerchant.store.StoreToken;
import com.icbc.mo.emerchant.store.controller.StoreTokenManager;
import com.icbc.mo.emerchant.user.HsTrStoreUser;
import com.icbc.mo.emerchant.user.controller.HsTrStoreUserManager;

/**
 * 送货接口
 * 
 * @author gyam-TatoLu
 * 
 */
public class DeliverIntf {
	private static HsTrDeliverCountManager deliverCountMgr = new HsTrDeliverCountManager();
	private static HsTrMasterOrderManager masterOrderMgr = new HsTrMasterOrderManager();
	private static HsTrDeliveryManager deliveryMgr = new HsTrDeliveryManager();
	private static HsTrOrderFlowManager orderFlowMgr = new HsTrOrderFlowManager();
	/**
	 * 送货相关方法
	 *
	 * @return IntfReturnObj 
	 */
	public IntfReturnObj addDeliver(BigDecimal dueAmount, StoreToken token) {
		String userId = token.getStoreUser();
		
		IntfReturnObj r = new IntfReturnObj();
		try {
			boolean exists = deliverCountMgr.checkExist(userId);
			if(!exists) {
				//There is no existing count, this is the first transaction. 
				//So Add a new count
/*				我晕。。。JPA居然不给手工执行Sql语句，要问问聂波怎么玩 20160221
 * 				ArgumentException: "Encountered "Insert" at character 1, but expected: ["DELETE", "SELECT", "UPDATE"]." while parsing JPQL "Insert Into HsTrDeliverCount h (userId, totalAmount, totalCount) values (:userId, :dueAmount, 1)".
 * 				boolean result = deliverCountMgr.addNew(userId, dueAmount);
				if(result){
					r.setAuthErr(false);
					r.setRes(true);
					r.setErrMsg("Success");
				}else{
					r.setAuthErr(false);
					r.setRes(false);
					r.setErrMsg("Add New Deliver Failed");
				}*/
				Date date = new Date();
				//org.apache.openjpa.persistence.RollbackException: Unable to obtain an object lock on "null".
				HsTrDeliverCount hsTrDeliverCount = new HsTrDeliverCount();
				hsTrDeliverCount.settotalAmount(dueAmount);
				hsTrDeliverCount.setHandoverTime(null);
				hsTrDeliverCount.settotalCount(BigDecimal.valueOf(1));
				hsTrDeliverCount.setUserId(userId);
				//hsTrDeliverCount.setId(UUID.randomUUID().toString().trim().replaceAll("-", ""));
				deliverCountMgr.createHsTrDeliverCount(hsTrDeliverCount);
				
				r.setAuthErr(false);
				r.setRes(true);
				r.setErrMsg("Success");
				return r;
			}else{
				//There is existing count, only add this deliver to existing count
				boolean result = deliverCountMgr.updateExist(userId, dueAmount);
				if(result){
					r.setAuthErr(false);
					r.setRes(true);
					r.setErrMsg("Success");
				}else{
					r.setAuthErr(false);
					r.setRes(false);
					r.setErrMsg("Update Deliver Failed");
				}
				return r;
			}
		} catch (Exception e) {
			return new IntfReturnObj(false,null,"Server error, please try again later!",IcbcUtil.Execption2String(e),false);
		}
	}
	
	public IntfReturnObj handoverDeliver(StoreToken token) {
		String userId = token.getStoreUser();
		IntfReturnObj r = new IntfReturnObj();
		try {
			boolean exists = deliverCountMgr.checkExist(userId);
			if(!exists) {
				//There is no existing count, just raise a exception
				
				r.setAuthErr(false);
				r.setRes(false);
				r.setErrMsg("請先完成訂單");

				return r;
			}else{
				//There is existing count, only add this deliver to existing count
				boolean result = deliverCountMgr.handover(userId);
				if(result){
					r.setAuthErr(false);
					r.setRes(true);
					r.setErrMsg("成功！");
				}else{
					r.setAuthErr(false);
					r.setRes(false);
					r.setErrMsg("Handover Failed");
				}
				return r;
			}
		} catch (Exception e) {
			return new IntfReturnObj(false,null,"Server error, please try again later!",IcbcUtil.Execption2String(e),false);
		}
	}
	
	public IntfReturnObj getDeliver(StoreToken token) {
		String userId = token.getStoreUser();
		IntfReturnObj r = new IntfReturnObj();
		try {
			boolean exists = deliverCountMgr.checkExist(userId);
			if(!exists) {
				//There is no existing count, just return a 0 count
				HsTrDeliverCount hsTrDeliverCount = new HsTrDeliverCount();
				hsTrDeliverCount.settotalAmount(BigDecimal.valueOf(0));
				hsTrDeliverCount.settotalCount(BigDecimal.valueOf(0));
				r.setData(hsTrDeliverCount);
				r.setAuthErr(false);
				r.setRes(true);
				r.setErrMsg("Success");
				return r;
			}else{
				//There is existing count, return this deliver
				List<HsTrDeliverCount> result = deliverCountMgr.getExist(userId);
				HsTrDeliverCount hsTrDeliverCount = result.get(0);
				r.setData(hsTrDeliverCount);
				r.setAuthErr(false);
				r.setRes(true);
				r.setErrMsg("Success");
				return r;
			}
		} catch (Exception e) {
			return new IntfReturnObj(false,null,"Server error, please try again later!",IcbcUtil.Execption2String(e),false);
		}
	}
	
	
	public IntfReturnObj finishOrder(String orderId, BigDecimal realAmount, StoreToken token) {

		IntfReturnObj r = new IntfReturnObj();
		try {
			//update order
			boolean result = masterOrderMgr.finishDeliverOrder(orderId);
			if(!result) {		
				r.setData(null);
				r.setAuthErr(false);
				r.setRes(false);
				r.setErrMsg("服務器錯誤，請重試");
				return r;
			}
			IntfReturnObj re = this.addDeliver(realAmount, token);
			if(!re.isRes()) {		
				r.setData(null);
				r.setAuthErr(false);
				r.setRes(false);
				r.setErrMsg("服務器錯誤，請重試");
				return r;
			}
			//Add a record to hs_tr_order_flow
			HsTrOrderFlow hsTrOrderFlow = new HsTrOrderFlow();
			hsTrOrderFlow.setCreateDate(new Date());
			hsTrOrderFlow.setCreateId(token.getUserData().getUserName());
			hsTrOrderFlow.setFlowId(UUID.randomUUID().toString().trim().replaceAll("-", ""));
			hsTrOrderFlow.setMsg("");
			hsTrOrderFlow.setOperType("31");//Already Finish Order
			hsTrOrderFlow.setOrderId(orderId);
			hsTrOrderFlow.setReason("");
			hsTrOrderFlow.setSourceType("1");
			orderFlowMgr.createHsTrOrderFlow(hsTrOrderFlow);
			
			r.setData(null);
			r.setAuthErr(false);
			r.setRes(true);
			return r;
		} catch (Exception e) {
			return new IntfReturnObj(false,null,"服務器錯誤，請重試",IcbcUtil.Execption2String(e),false);
		}
	}
	
	//分配订单
	public IntfReturnObj assignOrder(String orderId, String phone, StoreToken token) {

		IntfReturnObj r = new IntfReturnObj();
		String courierId = null; 
		try {
			List<HsTrDelivery> listHsTrDelivery = deliveryMgr.getDelivery(token.getStoreDetail().getStoreId(), phone);
			if(listHsTrDelivery.isEmpty()) {		
				//Add Record
				HsTrDelivery hsTrDelivery = new HsTrDelivery();
				hsTrDelivery.setCreateDate(new Date());
				hsTrDelivery.setCreateId(token.getUserData().getUserName());
				hsTrDelivery.setPhone(phone);
				hsTrDelivery.setStoreId(token.getStoreDetail().getStoreId());
				courierId = String.valueOf(UUID.randomUUID().toString().trim().replaceAll("-", ""));
				hsTrDelivery.setId(courierId);
				deliveryMgr.createHsTrDelivery(hsTrDelivery);
			}else{
				courierId = listHsTrDelivery.get(0).getId();
			}
			
			boolean result = masterOrderMgr.assignDeliverOrder(orderId, courierId);
			if(!result) {		
				r.setData(null);
				r.setAuthErr(false);
				r.setRes(false);
				r.setErrMsg("服務器錯誤，請重試");
				return r;
			}
			
			
			//Add a record to hs_tr_order_flow
			HsTrOrderFlow hsTrOrderFlow = new HsTrOrderFlow();
			hsTrOrderFlow.setCreateDate(new Date());
			hsTrOrderFlow.setCreateId(token.getUserData().getUserName());
			hsTrOrderFlow.setFlowId(UUID.randomUUID().toString().trim().replaceAll("-", ""));
			hsTrOrderFlow.setMsg("");
			hsTrOrderFlow.setOperType("21");//Already Assigned status
			hsTrOrderFlow.setOrderId(orderId);
			hsTrOrderFlow.setReason("");
			hsTrOrderFlow.setSourceType("1");
			orderFlowMgr.createHsTrOrderFlow(hsTrOrderFlow);
			
			
			r.setData(null);
			r.setAuthErr(false);
			r.setRes(true);
			return r;
		} catch (Exception e) {
			return new IntfReturnObj(false,null,"服務器錯誤，請重試",IcbcUtil.Execption2String(e),false);
		}
	}
	
	
	
}
