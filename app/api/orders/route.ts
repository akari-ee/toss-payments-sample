// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { amount, orderName, customerInfo } = await request.json();

    // Validate input
    if (!amount || !orderName) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Insert order into database
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        amount,
        order_name: orderName,
        customer_name: customerInfo?.name,
        customer_email: customerInfo?.email,
        customer_phone: customerInfo?.phone,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      orderId: order.order_id,
      amount: order.amount,
      orderName: order.order_name,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
    });
  } catch (error) {
    console.error("주문 생성 오류:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
