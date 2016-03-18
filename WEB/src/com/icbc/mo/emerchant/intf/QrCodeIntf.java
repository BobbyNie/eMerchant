package com.icbc.mo.emerchant.intf;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;

import com.ibm.jpa.web.NamedQueryTarget;
import com.icbc.IcbcUtil;
import com.icbc.JpaUtil;
import com.icbc.mo.emerchant.cust.HsTrCustInfo;
import com.icbc.mo.emerchant.cust.controller.HsTrCustInfoManager;
import com.icbc.mo.emerchant.order.HsTrMasterOrder;
import com.icbc.mo.emerchant.order.controller.HsTrMasterOrderManager;
import com.icbc.mo.emerchant.qr.HsTrQrcode;
import com.icbc.mo.emerchant.qr.controller.HsTrQrcodeManager;
import com.icbc.mo.emerchant.store.StoreToken;

public class QrCodeIntf {

	private static HsTrMasterOrderManager masterOrderManager = new HsTrMasterOrderManager();
	private static HsTrQrcodeManager qrCodeManager = new HsTrQrcodeManager();
	private static HsTrMasterOrder hsTrMasterOrder = new HsTrMasterOrder();
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
		HsTrQrcode qrCode = new HsTrQrcode();
		HsTrCustInfo custInfo = new HsTrCustInfo();
		String result = null;
		try {
			qrCode = qrCodeManager.findHsTrQrcodeByQrCodeId(qrCodeId);
			custInfo = custInfoManager.findHsTrCustInfoByCustId(qrCode.getCustId());
			result = custInfo.getPhone();
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
	public String insertOneMasterOrderRecord(String qrCodeId,
			Double costAmount, StoreToken token) throws Exception {
		Date createDate = new Date();
		SimpleDateFormat sdf = new SimpleDateFormat("yyMMddHHmmss");
		int seqId = masterOrderManager.getOrderNoSeq();
		String orderId = "m" + sdf.format(createDate) + seqId;

		try {
			HsTrQrcode qrCode = qrCodeManager
					.findHsTrQrcodeByQrCodeId(qrCodeId);
			if (qrCode == null) {
				// 客户端二维码被扫有效时间超时，商户需重扫二维码
				return "1";
			}

			if (hsTrMasterOrder != null) {
				hsTrMasterOrder = new HsTrMasterOrder();
			}
			hsTrMasterOrder.setOrderId(orderId);
			hsTrMasterOrder.setCreateDate(createDate);
			hsTrMasterOrder.setOrderType("3");// 二维码支付
			hsTrMasterOrder.setCustId(qrCode.getCustId());
			hsTrMasterOrder.setStoreId(qrCode.getStoreId());
			hsTrMasterOrder.setCurrency("MOP");
			hsTrMasterOrder.setCostAmount(costAmount * 100);// COST_AMOUNT
			hsTrMasterOrder.setRealAmount(costAmount * 100);// REAL_AMOUNT 未做
			hsTrMasterOrder.setDiscountAmount((double) 0);// DISCOUNT_AMOUNT
			hsTrMasterOrder.setOrderStatus("01");// 等待付款
			hsTrMasterOrder.setDiscountAmount((double) 0);
			hsTrMasterOrder.setPayType("1");// 在线支付

			// 订单表创建一条记录
			String insertResult = masterOrderManager
					.createHsTrMasterOrder(hsTrMasterOrder);
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

	// 确认金额后等待客户支付
	public String getThisOrderStatus(String orderId) {
		return masterOrderManager.findHsTrMasterOrderByOrderId(orderId).getOrderStatus();
	}

	// 回传支付完成结果
	public HsTrMasterOrder getThisOrderInfo(StoreToken token) {
		String orderId = hsTrMasterOrder.getOrderId();
		return masterOrderManager.findHsTrMasterOrderByOrderId(orderId);
	}

	// 获取支付通知信息
	public List<HsTrMasterOrder> getOrderPayResult(List<String> orderList) {

		List<HsTrMasterOrder> resultlist = new ArrayList<HsTrMasterOrder>();
		HsTrMasterOrder masterOrder = null;
		try {
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
