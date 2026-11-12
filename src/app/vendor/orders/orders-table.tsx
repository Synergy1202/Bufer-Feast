"use client";

import { useState } from "react";
import { Clock, CheckCircle, Truck, X, MapPin, AlertTriangle, ChefHat, ShoppingBag, Users, Calendar } from "lucide-react";
import { updateOrderStatus } from "./actions";

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      setSelectedOrder(null);
    } catch (error) {
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#183e32]">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">₦{order.total_price?.toLocaleString()}</td>
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
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm font-bold text-[#183e32] hover:text-[#90a765] transition-colors bg-gray-100 px-4 py-2 rounded-lg hover:bg-[#f0f3e8]"
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

      {/* DETAILED ORDER MODAL - SHOWS EVERYTHING */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-[#183e32] p-6 text-white flex justify-between items-start sticky top-0">
              <div>
                <p className="text-[#90a765] text-xs font-bold uppercase tracking-wider mb-1">Order Details</p>
                <h2 className="text-2xl font-bold">#{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-gray-300 text-sm mt-1 flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-[#183e32]">₦{selectedOrder.total_price?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total People</p>
                  <p className="text-xl font-bold text-[#183e32] flex items-center gap-1">
                    <Users size={16} />
                    {selectedOrder.headcount}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Type</p>
                  <p className="text-sm font-bold text-[#183e32] capitalize">{selectedOrder.event_type}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                    selectedOrder.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    selectedOrder.status === "preparing" ? "bg-blue-100 text-blue-700" :
                    selectedOrder.status === "out for delivery" ? "bg-purple-100 text-purple-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* ITEMS ORDERED - THE FOOD DETAILS */}
              <div>
                <h3 className="text-lg font-bold text-[#183e32] mb-4 flex items-center gap-2">
                  <ShoppingBag className="text-[#90a765]" size={20} />
                  Items Ordered
                </h3>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#90a765] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#90a765]/20 rounded-xl flex items-center justify-center">
                          <ChefHat size={24} className="text-[#183e32]" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{item.dish_name || "Menu Item"}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Users size={14} />
                            {item.headcount} people
                            <span className="mx-2">•</span>
                            ₦{(item.total_price / (item.headcount || 1)).toLocaleString()} per head
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-[#183e32] text-lg">₦{item.total_price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DELIVERY INFORMATION */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-lg font-bold text-[#183e32] flex items-center gap-2">
                  <MapPin className="text-[#90a765]" size={20} />
                  Delivery Information
                </h3>
                
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#90a765] mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedOrder.delivery_address}</p>
                  </div>
                </div>
                
                {selectedOrder.scheduled_time && (
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-[#90a765] mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Scheduled Delivery Time</p>
                      <p className="text-sm text-gray-700 font-medium">{new Date(selectedOrder.scheduled_time).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* ALLERGY WARNING - PROMINENT DISPLAY */}
                {selectedOrder.allergies && (
                  <div className="mt-4 bg-orange-50 border-2 border-orange-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-orange-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-orange-700 uppercase mb-1">️ Allergy Warning</p>
                        <p className="text-sm text-orange-800 font-medium leading-relaxed">{selectedOrder.allergies}</p>
                        <p className="text-xs text-orange-600 mt-2">Please review ingredients carefully before preparing!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                              {selectedOrder.special_instructions && (
                  <div className="mt-4 bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-700 uppercase mb-1">Special Instructions</p>
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">{selectedOrder.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

              {/* STATUS UPDATE BUTTONS */}
              <div className="pt-4 border-t-2 border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-4">Update Order Status</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "preparing")}
                    disabled={updating || selectedOrder.status === "delivered"}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 border-2 border-yellow-200 rounded-xl hover:bg-yellow-100 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChefHat size={18} /> Mark Preparing
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "out for delivery")}
                    disabled={updating || selectedOrder.status === "delivered"}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Truck size={18} /> Mark Dispatched
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrder.id, "delivered")}
                    disabled={updating}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-all text-sm font-bold disabled:opacity-50"
                  >
                    <CheckCircle size={18} /> Mark as Delivered
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