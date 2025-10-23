import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 환경변수에서 시크릿 키 가져오기
const SECRET_KEY = process.env.TOSSPAYMENTS_SECRET_KEY!;

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    // 1. 주문 정보 검증과 가격이 일치하는지 확인
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          message: "주문을 찾을 수 없습니다.",
          code: "ORDER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 2. 결제 금액 검증
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 결제 금액입니다.",
          code: "INVALID_AMOUNT",
        },
        { status: 400 }
      );
    }

    if (order.amount !== parsedAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `결제 금액이 일치하지 않습니다. (주문: ${order.amount}, 요청: ${parsedAmount})`,
          code: "AMOUNT_MISMATCH",
        },
        { status: 400 }
      );
    }

    // 2. 결제 승인 요청
    const tossResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(SECRET_KEY + ":").toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parsedAmount,
        }),
      }
    );

    const paymentData = await tossResponse.json();

    if (!tossResponse.ok) {
      // Update order status to failed
      await supabase
        .from("orders")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      return NextResponse.json(
        {
          success: false,
          message: paymentData.message || "결제에 실패했습니다.",
          code: paymentData.code || "PAYMENT_FAILED",
        },
        { status: tossResponse.status }
      );
    }

    // 3. Update order and create payment record
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_key: paymentKey,
        payment_method: paymentData.method,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (updateError) throw updateError;

    // 4. Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      payment_key: paymentKey,
      amount: amount,
      status: paymentData.status,
      card_company: paymentData.card?.company,
      card_number: paymentData.card?.number,
      receipt_url: paymentData.receiptUrl,
      approved_at: paymentData.approvedAt,
    });

    if (paymentError) throw paymentError;

    // 5. Return the updated order info
    const { data: updatedOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        paymentData,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "결제 처리 중 오류가 발생했습니다.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
