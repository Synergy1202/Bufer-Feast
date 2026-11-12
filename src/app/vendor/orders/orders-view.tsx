"use client";

import { useState } from "react";
import { ShoppingBag, Clock, CheckCircle, Truck, X, MapPin, ChefHat } from "lucide-react";
import { updateOrderStatus } from "./actions";

interface OrderItem {
  id: string;
  menu_id: string;
  headcount: number;
  total_price: number;
}

interface Order {
  id: string;
  user_id: string;
  delivery_address: string;
  event_type: string;
  scheduled_time: string;
  allergies: string;
  headcount: number;
  total_price: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

export function OrdersView({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">People</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#183e32]">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.user_id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.headcount} people</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{order.total_price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-fit ${
                      order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                      order.status === "out for delivery" ? "bg-purple-100 text-purple-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {order.status === "pending" && <Clock size={12}/>}
                      {order.status === "preparing" && <ChefHat size={12}/>}
                      {order.status === "out for delivery" && <Truck size={12}/>}
                      {order.status === "delivered" && <CheckCircle size={12}/>}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm font-bold text-[#183e32] hover:text-[#90a765] transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#183e32] p-6 text-white flex justify-between items-start">
              <div>
                <p className="text-[#90a765] text-xs font-bold uppercase tracking-wider mb-1">Order Details</p>
                <h2 className="text-2xl font-bold">#{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-gray-300 text-sm mt-1">Customer ID: {selectedOrder.user_id.slice(0, 8)}...</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total People</p>
                  <p className="text-lg font-bold text-[#183e32]">{selectedOrder.headcount} heads</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-[#183e32]">₦{selectedOrder.total_price.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin size={18} className="text-[#90a765] mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Address</p>
                    <p className="text-sm text-gray-700">{selectedOrder.delivery_address}</p>
                  </div>
                </div>
                {selectedOrder.allergies && (
                  <div className="flex items-start gap-3 mt-4">
                    <span className="text-orange-500 font-bold text-lg">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-orange-600 uppercase">Allergy Warning</p>
                      <p className="text-sm text-orange-800 font-medium">{selectedOrder.allergies}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Update Order Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "preparing")}
                    disabled={updating}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-bold disabled:opacity-50"
                  >
                    <ChefHat size={16} /> Mark Preparing
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "out for delivery")}
                    disabled={updating}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold disabled:opacity-50"
                  >
                    <Truck size={16} /> Mark Dispatched
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "delivered")}
                    disabled={updating}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-bold disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}