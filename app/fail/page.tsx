"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // 결제 실패 시 URL 파라미터에서 에러 정보 추출
    console.error("Payment failed:", { code, message, orderId });
    // 여기서 실패 로깅 또는 서버에 실패 알림을 보낼 수 있습니다.
    // 예: logPaymentFailure(code, message, orderId);
  }, [code, message, orderId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white rounded-lg text-center dark:bg-gray-800">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            결제에 실패했습니다
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2 rounded">
            {message}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-left text-sm">
          <div className="space-y-2">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  주문번호
                </span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {orderId}
                </span>
              </div>
            )}
            {code && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  에러 코드
                </span>
                <span className="font-mono text-gray-800 dark:text-white">
                  {code}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 text-sm font-medium text-center"
          >
            메인으로 돌아가기
          </Link>
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              계속해서 문제가 발생한다면 고객센터로 문의해주세요.
            </p>
            <a
              href="#"
              className="text-sm font-medium text-blue-500 hover:text-blue-600"
              onClick={(e) => {
                e.preventDefault();
                // 여기에 고객센터 연결 로직 추가
                console.log("Contact customer service");
              }}
            >
              고객센터 문의하기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
