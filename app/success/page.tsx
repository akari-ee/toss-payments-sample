/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const confirmPayment = async () => {
    // 쿼리 파라미터 값이 결제 요청할 때 보낸 데이터와 동일한지 반드시 확인하세요.
    // 클라이언트에서 결제 금액을 조작하는 행위를 방지할 수 있습니다.
    if (!paymentKey || !orderId || !amount) {
      router.push(
        `/fail?message=결제 정보가 올바르지 않습니다.&code=${"INVALID_PARAMETERS"}`
      );
    }

    try {
      // 결제 검증 API 호출
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = encodeURIComponent(
          data.message || "결제 검증에 실패했습니다."
        );
        const errorCode = encodeURIComponent(data.code || "UNKNOWN_ERROR");
        router.push(`/fail?message=${errorMessage}&code=${errorCode}`);
        return;
      }

      console.log("결제 검증 성공:", data);
      setIsConfirmed(true);
      setOrder(data.data.order);
      setPaymentData(data.data.paymentData);
    } catch (error) {
      console.error("결제 검증 중 오류 발생:", error);
      const errorMessage = encodeURIComponent(
        error instanceof Error
          ? error.message
          : "결제 처리 중 오류가 발생했습니다."
      );
      router.push(`/fail?message=${errorMessage}&code=VERIFICATION_ERROR`);
    } finally {
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white rounded-lg text-center dark:bg-gray-800">
        {isConfirmed ? (
          <aside>
            <div>
              <div className="mb-6 flex flex-col items-center space-y-4">
                <Image
                  src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
                  alt=""
                  width={120}
                  height={120}
                  className="w-30 h-30"
                />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  결제가 완료되었습니다!
                </h1>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-left">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  결제 정보
                </h2>
                {order && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        주문번호
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {order.order_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        주문명
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {order.order_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        결제 금액
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {order.amount
                          ? `${order.amount.toLocaleString()}원`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        결제 수단
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {order.payment_method || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        결제 상태
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {order.status === "paid" ? "결제 완료" : order.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        결제 일시
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {order.paid_at
                          ? new Date(order.paid_at).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  다시 테스트하기
                </Link>
              </div>
            </div>
            {paymentData && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  결제 상세 정보 (결제 승인 응답)
                </h3>
                <div className="space-y-2">
                  {Object.entries(paymentData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white break-all ml-4 text-right max-w-[70%]">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full max-w-md">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src="https://static.toss.im/lotties/loading-spot-apng.png"
                alt="결제 대기 중"
                width={120}
                height={120}
                className="w-30 h-30"
              />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center">
                결제 요청까지 성공했어요.
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                결제 승인하고 완료해보세요.
              </p>
            </div>
            <button
              onClick={confirmPayment}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              결제 승인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
