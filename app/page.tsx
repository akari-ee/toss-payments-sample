/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import {
  loadTossPayments,
  TossPaymentsWidgets,
  ANONYMOUS,
} from "@tosspayments/tosspayments-sdk";
import { supabase } from "@/lib/supabase";

const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY!;
const customerKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CUSTOMER_KEY!;

export default function Home() {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [amount, setAmount] = useState({
    currency: "KRW",
    value: 50_000,
  });
  const [ready, setReady] = useState(false);
  const [couponChecked, setCouponChecked] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "홍길동",
    email: "test@example.com",
    phone: "01012341234",
  });
  const [orderHistory, setOrderHistory] = useState<any[] | null>(null);
  const [isOrderHistoryLoading, setIsOrderHistoryLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  useEffect(() => {
    async function fetchPaymentWidgets() {
      // ------  결제위젯 초기화 ------
      const tossPayments = await loadTossPayments(clientKey);
      // 회원 결제
      const widgets = tossPayments.widgets({
        customerKey,
      });
      // 비회원 결제
      // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

      setWidgets(widgets);
    }

    fetchPaymentWidgets();
  }, []);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
      // ------ 주문의 결제 금액 설정 ------
      await widgets.setAmount(amount);

      await Promise.all([
        // ------  결제 UI 렌더링 ------
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        // ------  이용약관 UI 렌더링 ------
        widgets.renderAgreement({
          selector: "#agreement",
        }),
      ]);

      setReady(true);
    }

    renderPaymentWidgets();
  }, [widgets]);

  useEffect(() => {
    if (widgets == null) {
      return;
    }

    widgets.setAmount(amount);
  }, [widgets, amount]);

  const handleOrderHistory = async () => {
    try {
      setIsOrderHistoryLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_name", customerInfo.name)
        .eq("customer_email", customerInfo.email)
        .eq("customer_phone", customerInfo.phone)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrderHistory(data);
    } catch (error) {
      console.error("Order history error:", error);
    } finally {
      setIsOrderHistoryLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!widgets) {
      console.error("Payment widget not initialized");
      return;
    }

    try {
      // 1. 서버에 주문 정보 저장
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.value,
          orderName: "테스트 상품",
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || "주문 생성에 실패했습니다.");
      }

      const {
        orderId,
        amount: orderAmount,
        orderName,
        customerName,
        customerEmail,
        customerPhone,
      } = await orderResponse.json();

      // 2. 결제 요청
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        customerMobilePhone: customerPhone,
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black gap-6 py-12">
      <aside className="w-full p-6 bg-white rounded-lg dark:bg-gray-800 max-w-xl h-fit">
        <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          주문자 정보 입력
        </h3>
        <div className="space-y-4 mb-8">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              이름
            </label>
            <input
              type="text"
              id="name"
              value={customerInfo.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="이름을 입력해주세요"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={customerInfo.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="example@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              휴대폰번호
            </label>
            <input
              type="tel"
              id="phone"
              value={customerInfo.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="010-1234-5678"
            />
          </div>
        </div>
        <div>
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            disabled={isOrderHistoryLoading}
            onClick={handleOrderHistory}
          >
            {isOrderHistoryLoading ? "로딩 중..." : "주문 내역 보기"}
          </button>
          {orderHistory && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                주문 내역
              </h2>
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600 dark:text-gray-300">
                        주문번호
                      </div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {order.order_id}
                      </div>

                      <div className="text-gray-600 dark:text-gray-300">
                        상품명
                      </div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {order.order_name}
                      </div>

                      <div className="text-gray-600 dark:text-gray-300">
                        가격
                      </div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {order.amount?.toLocaleString()}원
                      </div>

                      <div className="text-gray-600 dark:text-gray-300">
                        주문일
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {new Date(order.created_at).toLocaleString()}
                      </div>

                      <div className="text-gray-600 dark:text-gray-300">
                        결제일
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {order.paid_at
                          ? new Date(order.paid_at).toLocaleString()
                          : "N/A"}
                      </div>

                      <div className="text-gray-600 dark:text-gray-300">
                        결제상태
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          }`}
                        >
                          {order.status === "pending"
                            ? "결제대기"
                            : order.status === "paid"
                            ? "결제완료"
                            : "결제실패"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
      <main className="w-full max-w-3xl p-6 bg-white rounded-lg dark:bg-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">
          토스페이먼츠 결제 테스트
        </h1>

        {/* 결제 금액 표시 */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">결제 금액</span>
            <span className="font-bold text-lg">
              {amount.value.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 결제 수단 선택 영역 */}
        <div id="payment-method" className="mb-6"></div>

        {/* 약관 동의 영역 */}
        <div id="agreement" className="mb-6"></div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <label
            htmlFor="coupon-box"
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="relative">
              <input
                id="coupon-box"
                type="checkbox"
                className="sr-only"
                disabled={!ready}
                onChange={() => {
                  const newChecked = !couponChecked;
                  setCouponChecked(newChecked);
                  setAmount((prev) => ({
                    ...prev,
                    value: newChecked
                      ? amount.value - 5_000
                      : amount.value + 5_000,
                  }));
                }}
                checked={couponChecked}
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  couponChecked
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 bg-gray-100 dark:border-gray-500 dark:bg-gray-600"
                }`}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <span
              className={`text-gray-700 dark:text-gray-200 ${
                !ready ? "opacity-50" : ""
              }`}
            >
              5,000원 할인 쿠폰 적용
            </span>
          </label>
        </div>
        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {amount.value.toLocaleString()}원 결제하기
        </button>
      </main>
    </div>
  );
}
