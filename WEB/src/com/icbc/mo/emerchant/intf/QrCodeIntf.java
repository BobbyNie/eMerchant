package com.icbc.mo.emerchant.intf;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;

import com.ibm.jpa.web.NamedQueryTarget;
import com.icbc.IcbcUtil;
import com.icbc.JpaUtil;
import com.icbc.mo.emerchant.cust.controller.HsTrCustInfoManager;
import com.icbc.mo.emerchant.order.HsTrMasterOrder;
import com.icbc.mo.emerchant.order.HsTrOrderFlow;
import com.icbc.mo.emerchant.order.controller.HsTrMasterOrderManager;
import com.icbc.mo.emerchant.order.controller.HsTrOrderFlowManager;
import com.icbc.mo.emerchant.qr.HsTrQrcode;
import com.icbc.mo.emerchant.qr.controller.HsTrQrcodeManager;
import com.icbc.mo.emerchant.store.StoreToken;

public class QrCodeIntf {

	private static HsTrMasterOrderManager masterOrderManager = new HsTrMasterOrderManager();
	private static HsTrQrcodeManager qrCodeManager = new HsTrQrcodeManager();
	private static HsTrCustInfoManager custInfoManager = new HsTrCustInfoManager();

	protected static final class NamedQueries {

		protected static final String TestQrCodeFunc = "UPDATE HsTrMasterOrder h set h.orderStatus = :orderStatus WHERE h.costAmount = :costAmount";
	}

	private EntityManagerFactory emf;

	private EntityManager getEntityManager() {
		if (emf == null) {
			emf = JpaUtil.getEmf();
		}
		return emf.createEntityManager();
	}

	// 获取客户手机号码
	public String getCustInfoByQrCodeId(String qrCodeId, StoreToken token) {

		String result = null;
		try {
			HsTrQrcode qrCode = new HsTrQrcode();
			qrCode = qrCodeManager.findHsTrQrcodeByQrCodeId(qrCodeId);
			result = custInfoManager.findHsTrCustInfoByCustId(qrCode.getCustId()).getPhone();
			updateQrCodeTable(qrCode, 2, token);

		} catch (Exception e) {
			IcbcUtil.Execption2String(e);
		}
		return result;
	}

	// 更新二维码表状态
	public IntfReturnObj updateQrCodeTable(HsTrQrcode qrCode, int qrCodeStatus,
			StoreToken token) {
		IntfReturnObj r = new IntfReturnObj();
		try {
			if (qrCode != null) {
				String storeId = token.getStoreDetail().getStoreId();

				// 更新二维码表--状态已扫描
				if (qrCodeStatus == 2) {
					qrCode.setStoreId(storeId);
					qrCode.setQrFunc(100);// 扫码付款
					qrCode.setReadTime(new Date());
				}
				qrCode.setStatus(qrCodeStatus);
				String result = qrCodeManager.updateHsTrQrcode(qrCode);

				if (result != "true") {
					r.setData(null);
					r.setAuthErr(false);
					r.setRes(false);
					r.setErrMsg("更新二维码状态失败");
					return r;
				}
			}
			r.setData(null);
			r.setAuthErr(false);
			r.setRes(true);
			return r;
		} catch (Exception e) {
			return new IntfReturnObj(false, null, "服務器錯誤，請重試",
					IcbcUtil.Execption2String(e), false);
		}

	}

	// 确认金额，创建订单记录
	public String insertOneMasterOrderRecord(String qrCodeId, Double costAmount, StoreToken token){
		
		Date createDate = new Date();
		SimpleDateFormat sdf = new SimpleDateFormat("yyMMddHHmmss");
		int seqId = masterOrderManager.getOrderNoSeq();
		String orderId = "m" + sdf.format(createDate) + seqId;

		try {
			HsTrQrcode qrCode = new HsTrQrcode();
			HsTrMasterOrder hsTrMasterOrder = new HsTrMasterOrder();
			qrCode = qrCodeManager.findHsTrQrcodeByQrCodeId(qrCodeId);
			if (qrCode == null) {
				// 客户端二维码被扫有效时间超时，商户需重扫二维码
				return "1";
			}
			
			hsTrMasterOrder.setOrderId(orderId);
			hsTrMasterOrder.setCreateDate(createDate);
			hsTrMasterOrder.setOrderType("3");// 二维码支付
			hsTrMasterOrder.setCustId(qrCode.getCustId());
			hsTrMasterOrder.setStoreId(qrCode.getStoreId());
			hsTrMasterOrder.setCurrency("MOP");
			hsTrMasterOrder.setCostAmount(costAmount * 100);// COST_AMOUNT
			hsTrMasterOrder.setRealAmount(costAmount * 100);// REAL_AMOUNT 
			hsTrMasterOrder.setDiscountAmount((double) 0);// DISCOUNT_AMOUNT
			hsTrMasterOrder.setOrderStatus("01");// 等待付款
			hsTrMasterOrder.setDiscountAmount((double) 0);
			hsTrMasterOrder.setPayType("1");// 在线支付

			// 订单表创建一条记录
			String insertResult = masterOrderManager.createHsTrMasterOrder(hsTrMasterOrder);
			
			
			//插入订单状态变更流水表
			HsTrOrderFlow orderFlow = new HsTrOrderFlow();
			HsTrOrderFlowManager orderFlowManager = new HsTrOrderFlowManager();
			String phone = custInfoManager.findHsTrCustInfoByCustId(qrCode.getCustId()).getPhone();
			String uuid = UUID.randomUUID().toString().trim().replaceAll("-", "");
			
			orderFlow.setCreateDate(createDate);
			orderFlow.setCreateId(phone);//用户手机号
			orderFlow.setFlowId(uuid);
			orderFlow.setOperType("01");
			orderFlow.setMsg("订单提交成功");
			orderFlow.setOrderId(orderId);
			orderFlow.setSourceType("1");//客户发起
			orderFlowManager.createHsTrOrderFlow(orderFlow);
			
			if (insertResult != "true") {
				// 插入订单记录错误
				return "2";
			}

			// 更改二维码表状态信息
			qrCode.setReaderData(orderId);
			updateQrCodeTable(qrCode, 3, token);

		} catch (Exception e) {
			IcbcUtil.Execption2String(e);
		}
		return orderId;
	}

	// 确认金额后轮询等待客户支付
	public String getThisOrderStatus(String orderId) {
		return masterOrderManager.findHsTrMasterOrderByOrderId(orderId).getOrderStatus();
	}
	
	// 回传支付完成结果
	public HsTrMasterOrder getThisOrderInfo(String orderId) {
		return masterOrderManager.findHsTrMasterOrderByOrderId(orderId);
	}
	
	// 商户取消确认金额
	public IntfReturnObj orderCanceledbyStore(String qrCodeId, StoreToken token){
		IntfReturnObj r = new IntfReturnObj();
		
		try{
			HsTrQrcode qrCode = new HsTrQrcode();
			qrCode = qrCodeManager.findHsTrQrcodeByQrCodeId(qrCodeId);
			r = updateQrCodeTable(qrCode, 1, token);
		}catch(Exception e) {
			IcbcUtil.Execption2String(e);
		}

		return r;
	}

	// 获取支付通知信息
	public List<HsTrMasterOrder> getOrderPayResult(List<String> orderList) {

		List<HsTrMasterOrder> resultlist = new ArrayList<HsTrMasterOrder>();
		
		try {
			HsTrMasterOrder masterOrder = new HsTrMasterOrder();
			Iterator<String> it = orderList.iterator();
			while (it.hasNext()) {
				String orderId = it.next();
				masterOrder = masterOrderManager.findHsTrMasterOrderByOrderId(orderId);
				resultlist.add(masterOrder);
			}
		} catch (Exception e) {
			IcbcUtil.Execption2String(e);
		}
		return resultlist;
	}

	@NamedQueryTarget("TestQrCodeFunc")
	public boolean TestQrCodeFunc(double costAmount, String orderStatus) {
		EntityManager em = getEntityManager();
		boolean results = false;
		try {
			em.getTransaction().begin();
			Query query = em.createQuery(NamedQueries.TestQrCodeFunc);
			query.setParameter("orderStatus", orderStatus);
			query.setParameter("costAmount", costAmount * 100);
			int rs = query.executeUpdate();
			if (rs == 1) {
				results = true;
			} else {
				results = false;
			}
			em.getTransaction().commit();
		} finally {
			em.close();
		}

		return results;
	}

}
