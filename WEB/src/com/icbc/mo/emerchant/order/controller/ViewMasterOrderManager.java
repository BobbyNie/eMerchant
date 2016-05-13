package com.icbc.mo.emerchant.order.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;

import com.ibm.jpa.web.Action;
import com.ibm.jpa.web.JPAManager;
import com.ibm.jpa.web.NamedQueryTarget;
import com.icbc.JpaUtil;
import com.icbc.mo.emerchant.order.ViewMasterOrder;
import com.icbc.mo.emerchant.store.StoreToken;

@SuppressWarnings("unchecked")
@JPAManager(targetEntity = com.icbc.mo.emerchant.order.ViewMasterOrder.class)
public class ViewMasterOrderManager {
	protected static final class NamedQueries {


    protected static final String getPendingAssignOrder = "SELECT h FROM ViewMasterOrder h WHERE h.storeId = :parm and h.orderStatus in ('11')";
    protected static final String getDeliverOrder = "SELECT h FROM ViewMasterOrder h WHERE h.storeId = :parm and h.orderStatus in ('21')";
	

	protected static final String getTodayFinishedOrder2 = "SELECT h FROM ViewMasterOrder h WHERE h.storeId = :storeId and h.orderStatus = '31' and h.createDateComp >= :dateStart";
	protected static final String getTodayFinishedOrderCount = "SELECT sum(h.realAmount) as totalAmount, count(1) as totalCount FROM ViewMasterOrder h WHERE h.storeId = :storeId and h.orderStatus = '31' and h.createDateComp >= :dateStart";//CURRENT_DATE";//to_char(h.create_date, 'YYYYMMDD') = to_char(sysdate, 'YYYYMMDD')";

	protected static final String getTodayFinishedOrder = "SELECT h.* FROM View_Master_Order h WHERE h.store_Id = ?1 and h.order_Status = '31' and to_char(h.create_Date_Comp, 'YYYYMMDD') = to_char(sysdate,'YYYYMMDD')";
	
	}
	public class ViewMasterOrderCountsResult {
		private String sumAmount;
		private String txnCount;
	
		public ViewMasterOrderCountsResult() {
		}
	
		public ViewMasterOrderCountsResult(String sumAmount, String txnCount) {
			this.sumAmount = sumAmount;
			this.txnCount = txnCount;
		}
	
		public String getsumAmount() {
			return sumAmount;
		}
	
		public void setsumAmount(String sumAmount) {
			this.sumAmount = sumAmount;
		}
	
		public String gettxnCount() {
			return txnCount;
		}
	
		public void settxnCount(String txnCount) {
			this.txnCount = txnCount;
		}
	}


    private EntityManagerFactory emf;

    public ViewMasterOrderManager() {

    }

    public ViewMasterOrderManager(EntityManagerFactory emf) {
        this.emf = emf;
    }

    public void setEntityManagerFactory(EntityManagerFactory emf) {
        this.emf = emf;
    }

    private EntityManager getEntityManager() {
        if (emf == null) {
            emf = JpaUtil.getEmf();
        }
        return emf.createEntityManager();
    }

    @Action(Action.ACTION_TYPE.CREATE)
    public String createViewMasterOrder(ViewMasterOrder ViewMasterOrder) throws Exception {
        EntityManager em = getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(ViewMasterOrder);
            em.getTransaction().commit();
        } catch (Exception ex) {
            try {
                if (em.getTransaction().isActive()) {
                    em.getTransaction().rollback();
                }
            } catch (Exception e) {
                ex.printStackTrace();
                throw e;
            }
            throw ex;
        } finally {
            em.close();
        }
        return "";
    }

    @Action(Action.ACTION_TYPE.DELETE)
    public String deleteViewMasterOrder(ViewMasterOrder ViewMasterOrder) throws Exception {
        EntityManager em = getEntityManager();
        try {
            em.getTransaction().begin();
            ViewMasterOrder = em.merge(ViewMasterOrder);
            em.remove(ViewMasterOrder);
            em.getTransaction().commit();
        } catch (Exception ex) {
            try {
                if (em.getTransaction().isActive()) {
                    em.getTransaction().rollback();
                }
            } catch (Exception e) {
                ex.printStackTrace();
                throw e;
            }
            throw ex;
        } finally {
            em.close();
        }
        return "";
    }

    @Action(Action.ACTION_TYPE.UPDATE)
    public String updateViewMasterOrder(ViewMasterOrder ViewMasterOrder) throws Exception {
        EntityManager em = getEntityManager();
        try {
            em.getTransaction().begin();
            ViewMasterOrder = em.merge(ViewMasterOrder);
            em.getTransaction().commit();
        } catch (Exception ex) {
            try {
                if (em.getTransaction().isActive()) {
                    em.getTransaction().rollback();
                }
            } catch (Exception e) {
                ex.printStackTrace();
                throw e;
            }
            throw ex;
        } finally {
            em.close();
        }
        return "";
    }

    @Action(Action.ACTION_TYPE.FIND)
    public ViewMasterOrder findViewMasterOrderByOrderId(String orderId) {
        ViewMasterOrder ViewMasterOrder = null;
        EntityManager em = getEntityManager();
        try {
            ViewMasterOrder = (ViewMasterOrder) em.find(ViewMasterOrder.class, orderId);
        } finally {
            em.close();
        }
        return ViewMasterOrder;
    }

    @Action(Action.ACTION_TYPE.NEW)
    public ViewMasterOrder getNewViewMasterOrder() {

        ViewMasterOrder ViewMasterOrder = new ViewMasterOrder();

        return ViewMasterOrder;
    }



	@NamedQueryTarget("getDeliverOrder")
	public List<ViewMasterOrder> getDeliverOrder(StoreToken token) {
		EntityManager em = getEntityManager();
		List<ViewMasterOrder> results = null;
		try {
			String parm = token.getStoreDetail().getStoreId();//"200";
			Query query = em.createQuery(NamedQueries.getDeliverOrder);
			query.setParameter("parm", parm);
			results = (List<ViewMasterOrder>) query.getResultList();
		} finally {
			em.close();
		}
		return results;
	}



    @NamedQueryTarget("getPendingAssignOrder")
    public List<ViewMasterOrder> getPendingAssignOrder(StoreToken token) {
        EntityManager em = getEntityManager();
        List<ViewMasterOrder> results = null;
        try {
            String parm = token.getStoreDetail().getStoreId();//"200";

            System.out.println("tatotest: parm="+parm);
            Query query = em.createQuery(NamedQueries.getPendingAssignOrder);
            query.setParameter("parm", parm);
            results = (List<ViewMasterOrder>) query.getResultList();
        } finally {
            em.close();
        }
        return results;
    }

	@NamedQueryTarget("getTodayFinishedOrder")
	public List<ViewMasterOrder> getTodayFinishedOrder(StoreToken token) {
		
		String storeId = token.getStoreDetail().getStoreId();
		List<ViewMasterOrder> results = null;
		EntityManager em = getEntityManager();
		try {
			Query query = em.createNativeQuery(NamedQueries.getTodayFinishedOrder,ViewMasterOrder.class);
			query.setParameter(1, storeId);
			results = query.getResultList();
			
		} finally {
			em.close();
		}
		return results;
	}
	
	@NamedQueryTarget("getTodayFinishedOrder2")
	public List<ViewMasterOrder> getTodayFinishedOrder2(StoreToken token) {
		
		String storeId = token.getStoreDetail().getStoreId();
		List<ViewMasterOrder> results = null;
		EntityManager em = getEntityManager();
		try {
			Query query = em.createQuery(NamedQueries.getTodayFinishedOrder2,ViewMasterOrder.class);
			query.setParameter("storeId", storeId);
			Date d = getDayWholePointDate(new Date());
			query.setParameter("dateStart", d);
			results = query.getResultList();
			
		} finally {
			em.close();
		}
		return results;
	}
	
	
	
	@NamedQueryTarget("getTodayFinishedOrderCount")
	public List<ViewMasterOrderCountsResult> getTodayFinishedOrderCount(StoreToken token) {
		EntityManager em = getEntityManager();
		List<ViewMasterOrderCountsResult> results = new ArrayList<ViewMasterOrderCountsResult>();
		try {
			String storeId = token.getStoreDetail().getStoreId();
			Query query = em.createQuery(NamedQueries.getTodayFinishedOrderCount);
			query.setParameter("storeId", storeId);
			query.setParameter("dateStart", getDayWholePointDate(new Date()));
			//results = query.getResultList();
			List<Object[]> multipleResults = (List<Object[]>) query.getResultList();

			for (Object[] result : multipleResults) {
				
				String sumAmount = "0";
				if (result[0]!=null){
					sumAmount = result[0].toString();
				}
				String txnCount = "0";
				if (result[1]!=null){
					txnCount = result[1].toString();
				}
				
				ViewMasterOrderCountsResult a = new ViewMasterOrderCountsResult(sumAmount, txnCount);
				results.add(a);
				//results.add(new ViewMasterOrderCountsResult(result[0].toString(), result[1].toString()));
			}
		} finally {
			em.close();
		}
		return results;
	}

	
	/** 
     *  
     * @param date 
     * @return 2014-3-3 00:00:00 
     */  
    public static Date getDayWholePointDate(Date date) {  
  
        GregorianCalendar gc = new GregorianCalendar();  
        gc.setTime(date);  
        if ((gc.get(gc.HOUR_OF_DAY) == 0) && (gc.get(gc.MINUTE) == 0)  
                && (gc.get(gc.SECOND) == 0)) {  
            return new Date(date.getTime());  
        } else {  
            Date date2 = new Date(date.getTime() - gc.get(gc.HOUR_OF_DAY) * 60 * 60  
                    * 1000 - gc.get(gc.MINUTE) * 60 * 1000 - gc.get(gc.SECOND)  
                    * 1000);  
            return date2;  
        }  
  
    }  

    
	
	public static void main(String[] args) {  
        
        Date date = new Date();  
          
        System.out.println(date.toString());  
          
        date = getDayWholePointDate(date);  
          
        System.out.println(date.toLocaleString());  
          
    }  
    
}
